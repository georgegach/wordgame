var Gameback = Gameback || {};
Gameback.data = {
	maxRoom : 4,
	roundCount : 3,
	roundLength : 120,
}


var express = require('express');
var timer = require('timer');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));


var users = {};
var games = {};
var gamers = {};

io.on('connection', function(socket)
{	

	socket.user = {};
	socket.on('loginByName', function(data)
	{
		var username = data.username;
		var color = data.color;
		request('http://localhost/client/register/' + username, function (error, response, body) 
		{
			body = JSON.parse(body);
			if (body.data.TOKEN.length == 32)
			{
				// console.log("Declaring user " + body.data.NAME);

				socket.user = 
				{
					id : body.data.ID,
					name : body.data.NAME,
					token : body.data.TOKEN,
					waiting : true,
					socketid : socket.id,
					color : color,
					score : 0,
					round : [],

				};
				users[socket.id] = socket.user;
			}

			// console.log("Hello " + socket.user.name + "#" + socket.user.id);
			socket.emit('logged', body);
			tryStartGame();
		});
	});

	socket.on('loginByToken', function(data)
	{
		var token = data.token;
		var color = data.color;

		request('http://localhost/client/get/' + token, function (error, response, body) 
		{
			// console.log(body);
			body = JSON.parse(body);
			// console.log(body);
			if (body.data != null && body.data.TOKEN.length == 32)
			{
				socket.user = 
				{
					id : body.data.ID,
					name : body.data.NAME,
					token : body.data.TOKEN,
					waiting : true,
					socketid : socket.id,
					color : color,
					score : 0,
					round : [],
				};
				users[socket.id] = socket.user;
			}
			else
			{
				socket.emit("unableToLoginByToken", "sorry");
				return;
			}

			// console.log("Hello " + socket.user.name + "#" + socket.user.id);
			socket.emit('logged', body);

			if (tryReconnect(socket.user))
				return;
			tryStartGame();
		});
	});

	socket.on("word", function(word)
	{
		var gameid = users[socket.id].gameid;
		games[gameid].players[socket.user.id].word = word;

		// socket.emit("debug", games[gameid].players[socket.id].word);
		// socket.emit("debug", games[gameid]);
	});

	socket.on("send", function(message)
	{
		var room = users[socket.id].gameid;
		io.to(room).emit("message", {username : socket.user.name, message : message, color : socket.user.color });
	});

	socket.on("debug", function(message)
	{
		console.log(message);
	});

	socket.on('disconnect', function()
	{
		// console.log(socket.user.name + " disconnected");
		delete users[socket.user.id];
	});

	socket.on("playerOut", function(data)
	{
		console.log(socket.user.name + " is logging out.")
		io.to(gamers[socket.user.id]).emit("playerOut", socket.user.id);
		io.to(gamers[socket.user.id]).emit("debug", socket.user.name + " has exited the game");
		delete gamers[socket.user.id];
	});
});

http.listen(9898, function(){
	console.log('listening on *:9898');
});

function getWaitinglist()
{
	var list = [];
	var players = 0;
	for(var prop in users)
	{
		if (users[prop].waiting == true )
		{
			list.push(users[prop]);
		}
	}
	return list;
}

function tryReconnect(user)
{
	for (var id in gamers)
	{
		if (id == user.id){
			if (games[gamers[id]].gameover != true)
			{
				var gameid = gamers[id];
				var thisGame = games[gameid];

				// join to game group
				io.sockets.sockets[user.socketid].join(gameid);

				// inherit old user
				thisGame.players[user.id].socketid = user.socketid;
				users[user.socketid].gameid = gameid;

				var players = [];

				forGamePlayers(gameid, function(id)
				{
					var player = games[gameid].players[id];
					players.push({id : player.id, name : player.name, color : player.color, score : player.round})
				});

				// send game details
				io.to(user.socketid).emit('gameOn', { gameid : gamers[id], players : players});

				// send round details
				sendRoundDetails(gameid, user.id);
				if (thisGame.players[user.id].roundDetails != null)
					io.to(user.socketid).emit("results", thisGame.players[user.id].roundDetails);

				

			}
			return false;
		}
	}
}


function tryStartGame()
{

	var available = getWaitinglist();
	if (available.length >= Gameback.data.maxRoom)
	{
		available = available.slice(0,Gameback.data.maxRoom);

		ids = [];
		players = [];
		for (var i = 0; i < available.length; i++) 
		{
			ids.push(available[i].id);

			players.push({id: available[i].id, name: available[i].name, color : available[i].color, score : available[i].round });
		}

		var gameData = 
		{ 
			roundCount : Gameback.data.roundCount, 
			players : ids 
		};

		request('http://localhost/client/game/create/' + gameData, function (error, response, body) 
		{
			var gameid = JSON.parse(body).gameid;
			console.log(gameid);



			for (var i = 0; i < players.length; i++) 
			{
				io.sockets.sockets[available[i].socketid].join(gameid);
				available[i].gameid = gameid;
				available[i].waiting = false;
				gamers[available[i].id] = gameid;
				io.to(available[i].socketid).emit('gameOn', { gameid : gameid, players : players});
			}

			// console.log(io.sockets.clients(gameid));

			var playersObj = arr2obj(available);
			games[gameid] = 
			{
				players : playersObj,
				roundNumber : 1,
				roundLength : Gameback.data.roundLength * 1000,
				gameover : false,
				secondsPassed : 0,
			}

			sendRoundDetails(gameid);
		});
	}
};

function sendRoundDetails(gameid, userid)
{
	// console.log('http://localhost/client/round/' + gameid);
	request('http://localhost/client/round/' + gameid, function (error, response, body) 
	{
		// console.log(body);
		body = JSON.parse(body);
		var thisGame = games[gameid];
		var players = thisGame.players;

		thisGame.commonLetters = body.LETTERS.slice(0,7);

		if (userid != undefined)
		{
			io.to(thisGame.players[userid].socketid).emit('round', {playerLetters : thisGame.players[userid].playerLetters, commonLetters : thisGame.commonLetters, roundNumber : thisGame.roundNumber });
		}
		else
		{
			var i = 0;
			for (var id in players) 
			{
				thisGame.players[id].word = "";
				thisGame.players[id].playerLetters = body.LETTERS.slice(7 + i*2, 7 + i*2 + 2);
				io.to(thisGame.players[id].socketid).emit('round', {playerLetters : thisGame.players[id].playerLetters, commonLetters : thisGame.commonLetters, roundNumber : thisGame.roundNumber });
				i++;
			} 	

			// set timer
			// var length = thisGame.roundLength - thisGame.secondsPassed;
			var timeout = setTimeout(function()
			{	
				roundOver(gameid);
			}, thisGame.roundLength);

			var interval = setInterval(function() 
			{
				var left = getTimeLeft(timeout);
				// thisGame.secondsPassed = thisGame.roundLength - left;

				if (left < -3)
				{
					io.to(gameid).emit("debug", "its over");
					
					// gameover
					clearInterval(interval);

					thisGame.roundNumber++;
					if (thisGame.roundNumber <= Gameback.data.roundCount)
					{
						request('http://localhost/client/nextround/' + gameid + "/" + thisGame.roundNumber, function (error, response, body) 
						{
							sendRoundDetails(gameid);
						});
					}
					else
					{
						gameOver(gameid);
					}
				}

				if (left > -1)
					io.to(gameid).emit("timer", left);
				
			}, 1000);

			function getTimeLeft(timeout) {
			    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
			}
		}
	});
}

function arr2obj(arr)
{
	var obj = {};
	for (var i = 0; i < arr.length; i++) {
		obj[arr[i].id] = arr[i];
	}
	return obj;
}

function roundOver(gameid)
{
	var thisGame = games[gameid];
	var words = [];

	io.to(gameid).emit("debug", "round over");
	forGamePlayers(gameid, function(id)
	{
		words.push({
			userid : thisGame.players[id].id,
			word : thisGame.players[id].word,
		})
	});	

	// console.log('http://localhost/client/check/' + JSON.stringify(words));
	request('http://localhost/client/check/' + JSON.stringify(words), function (error, response, body) 
	{
		body = JSON.parse(body);
		if (body.length < 1)
		{
			if (games[gameid].gameover)
				return;
			roundOver(gameid);
			console.log("saved ya");
			return;
		}
		// console.log(body);
		io.emit("debug" , body);
		io.emit("debug" , response);



		forGamePlayers(gameid, function(id)
		{	
			// console.log(games[gameid].players[id]);
			body[games[gameid].players[id].id].playerLetters = games[gameid].players[id].playerLetters;
			if (body[games[gameid].players[id].id].exists == "true"){
				// save round score
				games[gameid].players[id].round[games[gameid].roundNumber] = body[games[gameid].players[id].id].word.gameValue();
				// send current round score
				body[games[gameid].players[id].id].score = body[games[gameid].players[id].id].word.gameValue();
			}
			else
			{
				games[gameid].players[id].round[games[gameid].roundNumber] = 0;
				body[games[gameid].players[id].id].score = 0;
			}
		});

		var output = { roundNumber : games[gameid].roundNumber, players : body };
		
		forGamePlayers(gameid, function(id)
		{	
			games[gameid].players[id].roundDetails = output;
		});

		io.to(gameid).emit("results", output);
	});

}


function gameOver(gameid)
{
	io.to(gameid).emit("gameOver", "bye");
	games[gameid].gameover = true;
}




function forGamePlayers(gameid, callback)
{
	for(var id in games[gameid].players)
	{
		callback(id);
	}
}

String.prototype.gameValue = function() {
	var values =
	{
		"ა"	: 1,
		"ბ"	: 2,
		"გ"	: 3,
		"დ"	: 3,
		"ე"	: 1,
		"ვ"	: 4,
		"ზ"	: 6,
		"თ"	: 4,
		"ი"	: 1,
		"კ"	: 4,
		"ლ"	: 2,
		"მ"	: 2,
		"ნ"	: 3,
		"ო"	: 1,
		"პ"	: 6,
		// ჟ დაუზუსტებელია
		"ჟ"	: 9,
		"რ"	: 2,
		"ს"	: 2,
		"ტ"	: 4,
		"უ"	: 2,
		"ფ"	: 4,
		"ქ"	: 5,
		"ღ"	: 6,
		"ყ"	: 6,
		"შ"	: 4,
		"ჩ"	: 5,
		"ც"	: 4,
		"ძ"	: 7,
		"წ"	: 4,
		"ჭ"	: 7,
		"ხ"	: 4,
		"ჯ"	: 8,
		"ჰ"	: 10,
		"*" : 0,
	};
    var value = 0;
    for (var i = 0; i < this.length; i++) {
    	value += values[this[i]];
    }
    return value;
};