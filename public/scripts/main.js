




function loadOnlineModules()
{

	requirejs(["scripts/online/game.js"], function() {
		console.log("Online modules loaded");

		// Initialize SOCKET.IO
		socket = io();
		Game.data.socket = socket;
		socket.on('debug', function(data)
		{
			console.log(data);
		});


		// register user
		var token = localStorage.getItem("token");
		var color = Game.front.getColor();

		if (token != undefined)
			loginByToken();
		else
			loginByName();

		socket.on("unableToLoginByToken", function() {
			loginByName();
		});
		

		// Initialize helper functions
		function getColor() 
		{
			var hue = Math.floor(Math.random() * 30) * 12 ;
			return hue + ", 100%, 70%";
		};

		function loginByName()
		{
			
			var name = prompt("დასახელდი!", "Guest");
			socket.emit("loginByName", {username : name, color: color});
		}

		function loginByToken()
		{
			socket.emit("loginByToken", {token : token, color: color});
		}


		socket.on("logged", function(response)
		{
			console.log(response);

			Game.data.playerId = response.data.ID;
			Game.data.playerName = response.data.NAME;
			Game.data.playerToken = response.data.TOKEN;
			localStorage.setItem("token", Game.data.playerToken);

			Game.play.registerPlayer(new Game.Player(Game.data.playerName, Game.data.playerId, color ));
			Game.front.init();

		});

		socket.on("message", function(response)
		{
			console.log(response);
			var messagesContainer = document.querySelector("#messages");
			messagesContainer.innerHTML += "<li class='chatmessage' style='background-color:hsl("+ response.color +")'><span class='info'>" + response.username + "</span>:&nbsp;<span class='msg'>" + response.message + "</span></li>";
		});

		socket.on("gameOn", function(data)
		{
			console.log(data);
			Game.data.gameId = data.gameid;

			for (var i = 0; i < data.players.length; i++) 
			{
				if (data.players[i].id != Game.data.playerId)
				{
					Game.play.registerPlayer(new Game.Player(data.players[i].name, data.players[i].id,  data.players[i].color  ));
				}
				for(var id in data.players[i].round)
				{
					Game.data.players[Game.data.players.length - 1].score(id, data.players[i].round[id]);
				}
			}

			Game.play.init();
			Game.front.loaded();
			Game.front.gamePanel.updateLeadersList();
		});

		socket.on("round", function(data)
		{
			console.log(data);

			Game.play.init();
			Game.front.resetWord();
			Game.play.generateCards(data.commonLetters, data.playerLetters);
		});

		socket.on("timer", function(seconds)
		{
			console.log(seconds);
			Game.front.gamePanel.updateTimer(seconds);
			if (seconds < 1)
			{
				Game.front.scorePlaceholder("inline");
			}
		});

		socket.on("results", function(data)
		{
			console.log(data);
			Game.front.updateWords(data);
		});

		socket.on("gameOver", function(data)
		{
			console.log(data);
			var topPlayers = Game.data.players.slice(0);
			topPlayers.sort(function(a,b)
			{
				return a.totalScore() < b.totalScore();
			})

			var table = "";
			for (var i = 0; i < topPlayers.length; i++) {
				table += topPlayers[i].name + " - " + topPlayers[i].totalScore() + "<br/>";
			}

			Game.front.popupMessage(topPlayers[0].name + "-მა მოიგო!", 
									table,
									"location.reload()")
		});

		socket.on("playerOut", function(player)
		{
			document.querySelector(".player[id='" + player + "'] ").classList.add("inactive");
		});



	});
}

function loadOfflineModules()
{
	requirejs(["scripts/offline/game.js", "scripts/offline/wtrie.js"], function() {
		console.log("Offline modules loaded");
		Game.play.initNewGame(Game.play.newGame);
	});
}






function request(url, callback)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			callback(JSON.parse(this.responseText));
		}
	};
	xhttp.open("GET", url, true);
	xhttp.send();
}
