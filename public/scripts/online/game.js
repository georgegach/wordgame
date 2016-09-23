// ნეიმსფეისი
var Game = Game || {};
Game.data = 
{
	audioPath : "resources/interstellar.mp3",
	audio : new Audio(),
	gameCards : [],
	players : [],
	round : 0,
	roundLimit : 3,
	cardStock : null,
	timerMaxValue : 40,
	timerObject : null,
};


Game.play = 
{
	init : function()
	{
		// Game.front.init();
	},

	sendMessage : function()
	{
		var input = document.querySelector("#m");
		Game.data.socket.emit('send', input.value);
		input.value = "";
		return false;
	},

	initNewGame : function()
	{
		// Game.play.registerPlayer(new Game.Player(localStorage.getItem('name'), Game.front.getColor()));
		
	},

	roundPopup : function()
	{

		document.querySelector(".timer").classList.remove(Game.data.timerOnClass);
		Game.front.popupMessage("რაუნდის დასასრული",
			"თქვენ დააგროვეთ " + Game.data.players[0].score() + " ქულა!",
			"Game.play.nextRound()");
	},

	

	nextRound : function()
	{
		Game.play.resetRound();

		if (Game.data.round < Game.data.roundLimit)
		{
			var timer = document.querySelector(".timer");
			timer.classList.add(Game.data.timerOnClass);
			timer.innerHTML = Game.data.timerMaxValue;

			document.querySelector(".gamePanels .round").innerHTML = ++Game.data.round;
			Game.play.generateCards(Game.front.revealCards);


			Game.data.timerObject = setInterval(function()
			{
				if (timer.innerHTML < 2){
					Game.play.confirmWord();
				}
				timer.innerHTML--;
			}, 1000);
		}
		else
		{
			Game.play.endGame();
		}
		
	},

	resetRound : function()
	{
		Game.data.players.forEach(function(player)
		{
			document.querySelector(".player[id='"+ player.id +"'] .playerCards").innerHTML = "";
			document.querySelector(".player[id='"+ player.id +"'] .score").innerHTML = "&nbsp";
		})
		
	},

	newGame : function(data)
	{
		Game.data.players.forEach(function(player)
		{
			player.reset();
		})
		Game.data.deck = data.deck;
		Game.data.deck.init();

		Game.data.round = 0;
		Game.front.gamePanel.updateLeadersList();

		if (Game.data.timerMaxValue == 30)
			Game.data.timerOnClass = "timerOn30s";
		else if (Game.data.timerMaxValue == 45)
			Game.data.timerOnClass = "timerOn45s";
		else if (Game.data.timerMaxValue == 60)
			Game.data.timerOnClass = "timerOn60s";
		else
			Game.data.timerOnClass = "timerOn5s";

		Game.play.nextRound();
		
	},

	endGame : function()
	{
		Game.front.popupMessage("თამაშის დასასრული",
								"თამაშის გასაგრძელებლად",
								[
									{
										text:"დაიწყეთ თავიდან",
										action:"Game.play.newGame()"
									},
									{
										text:"გააგრძელეთ Infinite Mode-ში",
										action:"Game.play.infiniteMode()"
									}
								]);
	},

	infiniteMode : function()
	{
		Game.data.players.forEach(function(player)
		{
			player.reset();
		})

		Game.data.deck = new Game.Deck();
		Game.data.deck.init();

		Game.front.gamePanel.updateLeadersList();

		Game.data.mode = "infinite";
		// console.log("inifnitemode");
		Game.play.generateCards(Game.front.revealCards);
		document.querySelector(".timer").innerHTML = "∞";
		document.querySelector(".round").innerHTML = "∞";
		document.querySelector("#RefreshBtn").classList.remove("hidden");
	},

	registerPlayer : function(player)
	{
		if (player != undefined)
			Game.data.players.push(player);
		Game.front.revealPlayer(player);
	},

	generateCards : function(commonLetters, playerLetters)
	{
		// Game.front.resetWord();

		// Common cards
		for (var i = 0; i < commonLetters.length; i++) 
		{
			Game.data.gameCards[i] = new Game.Card(commonLetters[i]);
		}

		// Player cards
		for (var i = 0; i < playerLetters.length; i++) 
		{
			Game.data.players[0].cards([ 
				new Game.Card( playerLetters[0], Game.data.players[0].color ),
				new Game.Card( playerLetters[1], Game.data.players[0].color )
			]);
		}

		Game.front.revealCards();
	},

	confirmWord : function()
	{
		
	}

}

Game.front = 
{
	init : function()
	{
		this.loadAudio(Game.data.audioPath);
		this.listener.init();
	},

	loaded : function()
	{
		document.querySelector(".chatbox").classList.remove("hidden");
		document.querySelector(".loading").style.display = "none";

	},

	getColor : function()
	{
		var hue = Math.floor(Math.random() * 60) * 6 ;
		return hue + ", 100%, 70%";
	},
	
	popupMessage : function(title, body, buttons)
	{
		document.querySelector(".popupWrapper").classList.remove("hidden");
		var hidepopup = "this.parentElement.parentElement.parentElement.classList.add('hidden');";

		var popup = document.querySelector(".popupWrapper .popup");
		popup.querySelector("h1").innerHTML = title;
		popup.querySelector("p").innerHTML = body;

		var btns = popup.querySelector(".buttonsGroup");
		btns.innerHTML = "";
		

		if (buttons.constructor === String)
		{
			// Default popup [buttons = action]
			btns.innerHTML = '<div class="button" onclick="'+hidepopup + buttons +'">გაგრძელება&nbsp;&nbsp;<i class="fa fa-chevron-right" aria-hidden="true"></i></div>'
		}
		else
		{
			buttons.forEach(function(button)
			{
				btns.innerHTML += '<div class="button" onclick="'+hidepopup + button.action +'">'+ button.text +'</div>';
			});
		}
	},

	revealCards : function()
	{
		var cardArray = [];
		cardArray = cardArray.concat(Game.data.players[0].cards());		
		cardArray = cardArray.concat(Game.data.gameCards);

		var commonCardsContainer = document.querySelector(".commonCards");
		commonCardsContainer.innerHTML = "";
		cardArray.forEach(function(card)
		{
			var element = card.element();
			element.addEventListener("click", Game.front.action.chooseCard);
			commonCardsContainer.appendChild(element);
		})

		Game.front.gamePanel.startTimer(Game.data.timerMaxValue);

	},

	updateWords : function(results)
	{
		for (var id in results.players) 
		{
			var container = document.querySelector(".player[id='" + results.players[id].userid + "'] .playerCards");
			container.innerHTML = "";
			var word = results.players[id].word;
			var playerLetters = results.players[id].playerLetters;

			for (var i = 0; i < word.length; i++) 
			{
				var card = null;

				if (playerLetters.indexOf(word[i]) > -1)
				{
					playerLetters = playerLetters.replace(word[i],'');
					card = new Game.Card(word[i], results.players[id].userid.playerById().color).element();
				}
				else
					card = new Game.Card(word[i]).element();
				
				container.appendChild(card);
				
			}

		}
		Game.front.updateScores(results);
	},

	scorePlaceholder : function(displayStyle)
	{
		var els = document.querySelectorAll(".player .loading");
		for (var i = els.length - 1; i >= 0; i--) {
			els[i].style.display = displayStyle;
		}
	},

	updateScores : function(results)
	{
		Game.front.scorePlaceholder("none");
		for (var id in results.players) 
		{
			var container = document.querySelector(".player[id='" + results.players[id].userid + "'] .score");
			container.innerHTML = results.players[id].score;
			results.players[id].userid.playerById().score(results.roundNumber, results.players[id].score);
		}
		document.querySelector(".round").innerHTML = results.roundNumber;
		Game.front.gamePanel.updateLeadersList();
		// Game.front.updateMyScore();
	},

	revealPlayer : function(player)
	{
		document.querySelector(".players").appendChild(player.element());
	},

	loadAudio : function(path)
	{
		Game.data.audioPath = path;
		Game.data.audio = new Audio(Game.data.audioPath);
	},

	updateMyWord : function(callback)
	{
		var word = "";
		var chosenCards = document.querySelectorAll(".player[id='" + Game.data.players[0].id + "'] .card .letter");
		for (var i = 0; i < chosenCards.length; i++) {
			word += chosenCards[i].innerHTML
		}
		Game.data.players[0].word = word;
		socket.emit("word", word);
		// console.log(word, Game.data.wordlist.find(word))
		callback();
	},

	updateMyScore : function()
	{
		var score = Game.data.players[0].word.gameValue();
		document.querySelector(".player[id='"+ Game.data.players[0].id +"'] .score").innerHTML = score!=undefined?score:0;
	},

	resetWord : function()
	{
		var cards = document.querySelectorAll(".selected");
		
		for (var i = 0; i < cards.length; i++) {
			cards[i].classList.remove("selected");
		}
		
		for (var i = 0; i < Game.data.players.length; i++) {
			document.querySelector(".player[id='"+ Game.data.players[i].id +"'] .playerCards").innerHTML = "&nbsp;";
			document.querySelector(".player[id='"+ Game.data.players[i].id +"'] .score").innerHTML = "&nbsp;";
			
		}
		Game.front.updateMyWord( Game.front.updateMyScore );
	},

	gamePanel : 
	{

		startTimer : function(seconds)
		{
			var className = "timerOn" + seconds + "s";
			var timer = document.querySelector(".timer");
			timer.classList.add(className);
		},

		updateTimer : function(seconds)
		{
			document.querySelector(".timer").innerHTML = seconds;
		},

		updateRound : function(round)
		{
			document.querySelector(".round").innerHTML = round;
		},

		updateWordlist : function()
		{
			var table = document.querySelector(".wordlist table");
			table.innerHTML = "";

			var choices = Game.data.wordlist.bulkValue(Game.data.wordlist.validWords(Game.data.players[0].myLetters(), true));

			for (var i = choices.length - 1; i >= 0; i--) 
			{
				if (choices.length - i > 5)
					break;
				var row = table.insertRow(-1);
				var c1 = row.insertCell(0);
				var c2 = row.insertCell(1);
				var c3 = row.insertCell(2);
				c1.innerHTML = choices.length - i;
				c2.innerHTML = choices[i][0];
				c3.innerHTML = choices[i][1];
			}

		},

		updateLeadersList : function()
		{
			var table = document.querySelector(".statistics table");
			table.innerHTML = "";

			var row = table.insertRow(0);
			var c1 = row.insertCell(0);
			var c2 = row.insertCell(1);
			var c3 = row.insertCell(2);
			c1.innerHTML = "";
			c2.innerHTML = "<strong>მოთამაშე</strong>";
			c3.innerHTML = "<strong>ქულა</strong>";

			
			var topPlayers = Game.data.players.slice(0);
			topPlayers.sort(function(a,b)
			{
				return a.totalScore() < b.totalScore();
			})


			for (var i = 0, l = topPlayers.length; i < l; i++) 
			{
				var row = table.insertRow(-1);
				var c1 = row.insertCell(0);
				var c2 = row.insertCell(1);
				var c3 = row.insertCell(2);
				c1.innerHTML = i+1;
				c2.innerHTML = topPlayers[i].name;
				c3.innerHTML = topPlayers[i].totalScore();
			}
		}
	},

	action : {
		chooseCard : function(e)
		{
			if (!this.classList.contains("selected") )
			{
				var card = this.cloneNode(true);
				card.addEventListener("click", Game.front.action.removeCard);
				document.querySelector(".player[id='"+ Game.data.players[0].id +"'] .playerCards").appendChild(card);
				this.classList.add("selected");
			}
			else
			{
				this.classList.remove("selected");
				var letter = this.querySelector(".letter").innerHTML;
				var card = document.querySelector(".player[id='"+ Game.data.players[0].id +"'] .card[name='"+ letter +"']");
				card.parentNode.removeChild(card);
			}

			Game.front.updateMyWord( Game.front.updateMyScore );
		},

		removeCard : function(e)
		{
			var letter = this.querySelector(".letter").innerHTML;
			document.querySelector(".commonCards .card[name='"+ letter +"']").classList.remove("selected");
			this.parentNode.removeChild(this);
			Game.front.updateMyWord( Game.front.updateMyScore );
		},

	},

	listener : {
		init : function(){
			this.soundBtn();
			this.exitBtn();
			this.kbdShortcuts();
			// this.popupButton();
		},

		soundBtn : function()
		{
			document.querySelector(".soundIcon").addEventListener("click", function(event) {
				if (!Game.data.audio.paused){
					event.target.setAttribute("class", "fa fa-volume-off");
					Game.data.audio.pause();
				}
				else{
					event.target.setAttribute("class", "fa fa-volume-up ");
					Game.data.audio.play();
				}
			});
		},

		exitBtn : function()
		{
			document.querySelector(".exitIcon").addEventListener("click", function(event) {
				console.log("exiting game");
				Game.data.socket.emit("playerOut", "bye");
				localStorage.setItem('token', null);
				location.reload();
			});
		},

		kbdShortcuts : function()
		{
			window.onkeyup = function(e) {
			   var key = e.keyCode ? e.keyCode : e.which;
			   // console.log(key);
			   // Enter
			   if (key == 13) 
			       Game.play.confirmWord();
			   // Backspace
			   else if (key == 8) 
			       Game.front.resetWord();
			   // R
			   else if (key == 82)
			 		Game.play.generateCards(Game.front.revealCards);
			}
		},

		popupButton : function()
		{
			document.querySelector(".popupWrapper .popup div").addEventListener("click", function(event) {
				document.querySelector(".popupWrapper").classList.add("hidden");
			}, false);
		}


	}


}



Game.classExtender =
{
	stringExtender : (function() {

		String.prototype.element = function() {
		    var d = document.createElement('div');
			d.innerHTML = this;
			return d.firstChild;
		};

		String.prototype.gameValue = function() {
		    var value = 0;
		    for (var i = 0; i < this.length; i++) {
		    	value += Game.Alphabet.value[this[i]];
		    }
		    return value;
		};

		String.prototype.pop = function(i) {
			return this.substring(0, i) + this.substring(i + 1);
		};

		String.prototype.playerById = function()
		{
			for (var i = Game.data.players.length - 1; i >= 0; i--) {
				if (Game.data.players[i].id == this)
					return Game.data.players[i];
			}
			return false;
		}
	})(),
}

/* ============================================================================================
 * Class : 			Alphabet
 * Description: 	ალფავიტი
 */
Game.Alphabet = 
{

	array : "აააბგდევზთიიიკლმნოოოპჟრსტუუუფქღყშჩცძწჭხჯჰ***" ,	

	

	// პირველი არხის თამაშის სქრინშოტებიდან შეგროვებული მნიშვნელობები
	value : 
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
	},
}




/* ============================================================================================
 * Class : 			Player
 * Description: 	მოთამაშეები
 */
Game.Player = function(name, id, color)
{
	this.name = name;
	this.id = id;
	this.color = color;
	this.word = "";
	this.scoreArray = [];
	this.cardArray = [];
}

Game.Player.prototype = {
	reset : function()
	{
		this.word = "";
		this.scoreArray = [];
		this.cardArray = [];
	},

	cards : function(array)
	{
		if (array != undefined)
			this.cardArray = array;
		else
			return this.cardArray;
	},

	element : function()
	{
		var inner = 
		'<div class="player" id="'+ this.id +'">\
			<div class="playerStats myStats">\
				<div class="avatar" style="background-color: hsl('+ this.color +')"></div>\
				<div class="name">'+ this.name +'</div>\
				<div class="score">&nbsp;</div>\
			</div>\
			<div class="playerCards">\
			</div>\
		</div>';
		return inner.element();
	},



	myLetters : function()
	{
		var letters = "";
		for (var i = 0; i < Game.data.gameCards.length; i++) {
			letters += Game.data.gameCards[i].letter;
		}
		letters += this.cards()[0].letter + this.cards()[1].letter; 
		return letters;
	},

	score : function(roundNumber, value)
	{
		this.scoreArray[roundNumber] = value;
	},

	totalScore : function()
	{
		return this.scoreArray.reduce(function(a,b) { return a+b}, 0);
	}
}




/* ============================================================================================
 * Class : 			Card
 * Description: 	სათამაშო ბარათები ანბანის ასოებითა და მნიშვნელობებით
 */
Game.Card = function(letter, color)
{
	this.letter = letter;
	this.color = color;
}

Game.Card.prototype = {
	// HTML ელემენტის გენერირება ფერის მიხედვით
	element : function() 
	{
	    if (this.color != undefined)
	    {
		    var inner = '<div class="card" name="'+ this.letter +'"><div class="letter" style="background-color: hsla('+ this.color +', 0.5)">' + this.letter + 
		    			'</div><div class="value" style="background-color: hsla('+ this.color +', 1)">' + this.value() + '</div></div>';
	    }
	    else {
	    	var inner = '<div class="card" name="'+ this.letter +'"><div class="letter">' + this.letter + 
	    				'</div><div class="value">' + this.value() + '</div></div>';
	    }
		return inner.element();
	},

	value : function() 
	{
		return Game.Alphabet.value[this.letter];
	}
};
