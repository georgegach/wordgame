// ნეიმსფეისი
var Game = Game || {};
Game.data = 
{
	audioPath : "assets/interstellar.mp3",
	audio : new Audio(),
	gameCards : [],
	players : [],
	trie : null,
	AI : [],
	round : 0,
	roundLimit : 3,
	cardStock : null,
	timerMaxValue : 30,
	timerObject : null,
	deck : null,
	
};


Game.play = {
	init : function()
	{
		Game.front.init();
	},

	initWordlist : function(trie)
	{
		Game.data.wordlist = new Game.Words(trie);
		this.init();
	},

	initNewGame : function()
	{
		Game.play.registerPlayer(new Game.Player(prompt("ვინ არის?", "გიორგი"), "255,135,85"));
		// Game.play.registerPlayer(new Game.Player("George", "255,135,85"));

		var difficulty = document.querySelector("#difficulty").value / 100;

		Game.play.registerPlayer(new Game.Player("AI", "255,85,135"));
		Game.data.AI.push(new Game.AI(Game.data.players[1], difficulty));

		Game.play.registerPlayer(new Game.Player("SYS", "68,170,170"));
		Game.data.AI.push(new Game.AI(Game.data.players[2], 1));

		Game.play.newGame();
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
			document.querySelector(".player[name='"+ player.name +"'] .playerCards").innerHTML = "";
			document.querySelector(".player[name='"+ player.name +"'] .score").innerHTML = "&nbsp";
		})
		
	},

	newGame : function()
	{
		Game.data.players.forEach(function(player)
		{
			player.reset();
		})
		Game.data.deck = new Game.Deck();
		Game.data.deck.init();

		Game.data.round = 0;
		Game.front.gamePanel.updateLeadersList();

		if (Game.data.timerMaxValue == 30)
			Game.data.timerOnClass = "timerOn30s";
		else if (Game.data.timerMaxValue == 45)
			Game.data.timerOnClass = "timerOn45s";
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
		Game.data.mode = "infinite";
		// console.log("inifnitemode");
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

	generateCards : function(callback)
	{
		Game.front.resetWord();

		// Common cards
		for (var i = 0; i < 7; i++) 
		{
			Game.data.gameCards[i] = new Game.Card(
				Game.data.deck.random()
			);
		}

		// Player cards
		for (var i = 0; i < Game.data.players.length; i++) {
			Game.data.players[i].cards([ 
				new Game.Card( Game.data.deck.random(), Game.data.players[i].color ),
				new Game.Card( Game.data.deck.random(), Game.data.players[i].color )
			]);
		}

		callback();
	},

	confirmWord : function()
	{
		clearInterval(Game.data.timerObject);
		var word = Game.data.players[0].word;
		var search = Game.data.wordlist.find(word);
		if ( search!= null){
			Game.data.players[0].score(Game.data.wordlist.value(word));
			// console.log(search, Game.data.wordlist.value(word));
		}
		else {
			Game.data.players[0].score(0);
			// console.log(search, "Not a word.")
		}

		for (var i = 0; i < Game.data.AI.length; i++) {
			Game.data.AI[i].chooseWord();
		}
		Game.front.updateWords(Game.front.updateScores);
		Game.front.gamePanel.updateWordlist();
		if (Game.data.mode != "infinite")
			Game.play.roundPopup();
	}

}

Game.front = 
{
	init : function()
	{
		this.loadAudio(Game.data.audioPath);
		this.listener.init();
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

	},

	updateWords : function(callback)
	{
		for (var i = 1; i < Game.data.players.length; i++) 
		{
			var container = document.querySelector(".player[name='" + Game.data.players[i].name + "'] .playerCards");
			container.innerHTML = "";
			var word = Game.data.players[i].word;
			if (Game.data.players[i].cards().length > 0)
				var hisCards = [Game.data.players[i].cards()[0].letter , Game.data.players[i].cards()[1].letter ];
			
			for (var j = 0; j < word.length; j++) 
			{
				var index = hisCards.indexOf(word[j]);
				if (index > -1){
					hisCards.splice(index, 1)
					var card = new Game.Card(word[j], Game.data.players[i].color).element();
				}
				else 
					var card = new Game.Card(word[j]).element();
				container.appendChild(card);
			}
		}
		callback();
	},

	updateScores : function()
	{
		for (var i = 1; i < Game.data.players.length; i++) 
		{
			var container = document.querySelector(".player[name='" + Game.data.players[i].name + "'] .score");
			container.innerHTML = Game.data.wordlist.value(Game.data.players[i].word);
			Game.data.players[i].score(Game.data.wordlist.value(Game.data.players[i].word));
		}
		Game.front.gamePanel.updateLeadersList();
		Game.front.updateMyScore();
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
		var chosenCards = document.querySelectorAll(".player[name='" + Game.data.players[0].name + "'] .card .letter");
		chosenCards.forEach(function(card)
		{
			word += card.innerHTML;
		})	
		Game.data.players[0].word = word;
		// console.log(word, Game.data.wordlist.find(word))
		callback();
	},

	updateMyScore : function()
	{
		var score = 0;
		for (var i = 0, length = Game.data.players[0].word.length; i < length ; i++) {
			score += Game.Alphabet.value[ Game.data.players[0].word[i] ]; 
		}
		document.querySelector(".player[name='"+ Game.data.players[0].name +"'] .score").innerHTML = score!=undefined?score:0;
	},

	resetWord : function()
	{
		var cards = document.querySelectorAll(".selected");
		cards.forEach(function(card)
		{
			card.classList.remove("selected");
		});
		document.querySelector(".player[name='"+ Game.data.players[0].name +"'] .playerCards").innerHTML = "";
		Game.front.updateMyWord( Game.front.updateMyScore );
	},

	gamePanel : 
	{
		updateWordlist : function()
		{
			var table = document.querySelector(".wordlist table");
			table.innerHTML = "";

			var choices = Game.data.wordlist.bulkValue(Game.data.wordlist.validWords(Game.data.players[0].myLetters()));

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
				document.querySelector(".player[name='"+ Game.data.players[0].name +"'] .playerCards").appendChild(card);
				this.classList.add("selected");
			}
			else
			{
				this.classList.remove("selected");
				var letter = this.querySelector(".letter").innerHTML;
				var card = document.querySelector(".player[name='"+ Game.data.players[0].name +"'] .card[name='"+ letter +"']");
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
			this.kbdShortcuts();
			// this.popupButton();
		},

		soundBtn : function()
		{
			document.querySelector(".soundIcon").addEventListener("click", function(event) {
				if (!Game.data.audio.paused){
					event.target.setAttribute("class", "fa fa-volume-off disabled");
					Game.data.audio.pause();
				}
				else{
					event.target.setAttribute("class", "fa fa-volume-up ");
					Game.data.audio.play();
				}
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

		String.prototype.pop = function(i) {
			return this.substring(0, i) + this.substring(i + 1);
		};
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
 * Class : 			AI
 * Description: 	ხელოვნური ინტელექტი
 */
Game.AI = function(player, difficulty)
{
	this.difficulty = difficulty;
	this.player = player;
}

Game.AI.prototype = 
{
	chooseWord : function()
	{
		var wordlist = Game.data.wordlist;
		var search = wordlist.validWords(this.player.myLetters());
		var values = wordlist.bulkValue(search);
		if (values.length > 0)
			this.player.word = values[Math.floor(this.difficulty*(values.length-1))][0];
		else
			this.player.word = "";
		// console.log(this.player.name, this.player.word, search)
	},

	

}

/* ============================================================================================
 * Class : 			Player
 * Description: 	მოთამაშეები
 */
Game.Player = function(name, color)
{
	this.name = name;
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
		'<div class="player" name="'+ this.name +'">\
			<div class="playerStats myStats">\
				<div class="avatar" style="background-color: rgb('+ this.color +')"></div>\
				<div class="name">'+ this.name +'</div>\
				<div class="score">&nbsp;</div>\
			</div>\
			<div class="playerCards"></div>\
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

	score : function(value)
	{
		if (value != undefined)
			this.scoreArray.push(value);
		else
			return this.scoreArray[this.scoreArray.length-1];
	},

	totalScore : function()
	{
		return this.scoreArray.reduce(function(a,b) { return a+b}, 0);
	}
}


/* ============================================================================================
 * Class : 			Words
 * Description: 	სიტყვების სია Trie პრინციპით
 */
Game.Words = function(trie) 
{ 
	this.trie = trie;
}

Game.Words.prototype = 
{
	alphabet : "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ",
	
	validWords : function(letters)
	{
		var results = [];
		this._validWords(letters, "", results);

		results = results.filter(function(item, pos, self) {
		    return self.indexOf(item) == pos;
		})

		return results;
	},

	_validWords : function(letters, word, results)
	{

		if (word === undefined)
			word = "";

		for (var i = 0; i < letters.length; i++) 
		{
			if (letters[i] == "*")
			{
				for (var j = 0; j < this.alphabet.length; j++) {
					var nword = word + this.alphabet[j];
					var search = this.prefix(nword);

					if (!search.isPrefix && !search.isWord)
						continue;
					if (this.prefix(nword).isWord)
						results.push(nword);

					this._validWords(letters.pop(i), word + this.alphabet[j], results);
				}
			}
			else
			{
				var nword = word + letters[i];
				var search = this.prefix(nword);

				if (!search.isPrefix && !search.isWord)
					continue;
				if (this.prefix(nword).isWord)
					results.push(nword);

				this._validWords(letters.pop(i), word + letters[i], results);
			}
		}
	},

	prefix : function(str)
	{
		var trie = this.trie;
		for (var i = 0; i < str.length; i++) {
			if (trie[str[i]] != undefined)
			{
				trie = trie[str[i]];
			}
			else
				return false;
		}
		if (trie.$)
			return {isWord: true, isPrefix: true}
		return { isWord: false, isPrefix: true}
	},

	_find : function(word)
	{
		var trie = this.trie;

		for (var i = 0; i < word.length; i++) 
		{
			if (trie[word[i]] != undefined){
				if (i == word.length-1 && trie[word[i]].$)
					return true;
				else
					trie = trie[word[i]];
			}
			else 
				return false;
		}
		return false;
	},

	find : function(word, array)
	{
		if (word.indexOf("*") == -1 )
		{
			if (this._find(word))
				return word;
			return null;
		} 
		else 
		{
			if (array == undefined)
				array = [];

			for (var i = 0; i < this.alphabet.length; i++) 
			{
				var modified = word.replace("*", this.alphabet[i]);
				var search = this.find(modified, [] );
				if( search != null )
					array = array.concat(search);
			}
			
			if (array.length > 0)
				return array;
			return null;
		}
	},

	bulkFind : function(array, properWord)
	{
		var results = [];
		for (var i = 0; i < array.length; i++) {
			var search = this.find(array[i]);
			if (search != null)
			{
				if (properWord != undefined)
					results = results.concat(search);
				else
					results.push(array[i]);
			}
		}

		var results = results.filter(function(item, pos, self) {
		    return self.indexOf(item) == pos;
		})

		// // console.log(results);
		// var results = results.filter(function(item, pos, self) {
		//     return item.length > 2;
		// })
		// console.log(results);

		return results;
	},

	value : function(str)
	{
		var score = 0;
		for (var i = 0; i < str.length; i++) {
			score += Game.Alphabet.value[str[i]];
		}
		return score;
	},

	bulkValue : function(array)
	{
		var sortedArray = [];
		for (var i = 0; i < array.length; i++)
		{
			sortedArray.push([array[i], this.value(array[i])]);
		} 
		sortedArray = sortedArray.sort(function(a, b){ return a[1] - b[1]; });
		return sortedArray;
	}


};


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
		    var inner = '<div class="card" name="'+ this.letter +'"><div class="letter" style="background-color: rgba('+ this.color +', 0.5)">' + this.letter + 
		    			'</div><div class="value" style="background-color: rgba('+ this.color +', 1)">' + this.value() + '</div></div>';
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

Game.Deck = function()
{

	this.cards = "";
}

Game.Deck.prototype =
{
	init : function()
	{
		// console.log("initializing card deck");
		var that = this;
		for( var l in that.config)
		{
			for (var i = 0; i < that.config[l]; i++) {
				
				that.cards += l;
			}
		}
	},

	config : 
	{
		"ა"	: 6,
		"ბ"	: 2,
		"გ"	: 2,
		"დ"	: 3,
		"ე"	: 5,
		"ვ"	: 2,
		"ზ"	: 1,
		"თ"	: 2,
		"ი"	: 6,
		"კ"	: 2,
		"ლ"	: 3,
		"მ"	: 2,
		"ნ"	: 2,
		"ო"	: 4,
		"პ"	: 2,
		"ჟ"	: 1,
		"რ"	: 4,
		"ს"	: 4,
		"ტ"	: 2,
		"უ"	: 4,
		"ფ"	: 1,
		"ქ"	: 2,
		"ღ"	: 1,
		"ყ"	: 2,
		"შ"	: 2,
		"ჩ"	: 2,
		"ც"	: 2,
		"ძ"	: 2,
		"წ"	: 2,
		"ჭ"	: 1,
		"ხ"	: 2,
		"ჯ"	: 1,
		"ჰ"	: 2,
		"*" : 3,
	},

	pop : function(letter)
	{
		var index = this.cards.indexOf(letter);
		this.cards = this.cards.substring(0, index)+this.cards.substring(index + 1);
		return letter;
	},

	random : function()
	{
		var that = this;
		// console.log(that.cards);
		if (this.cards.length == 0)
			this.init();
		return that.pop(that.cards[ Math.round( Math.random() * ( that.cards.length-1 ) ) ]);

	},

	shuffle : function()
	{
		var a = this.cards.split(""),
		    n = a.length;

		for(var i = n - 1; i > 0; i--) {
		    var j = Math.floor(Math.random() * (i + 1));
		    var tmp = a[i];
		    a[i] = a[j];
		    a[j] = tmp;
		}

		this.cards = a.join("");
	},
}