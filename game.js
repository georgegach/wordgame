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
	
};


Game.play = {
	init : function()
	{
		Game.front.init();
		this.newGame();
	},

	initWordlist : function(trie)
	{
		Game.data.wordlist = new Game.Words(trie);
		this.init();
	},

	newGame : function()
	{
		// Game.play.registerPlayer(new Game.Player(prompt("ვინ არის?", "გიორგი"), "255,135,85"));
		Game.play.registerPlayer(new Game.Player("George", "255,135,85"));
		Game.play.registerPlayer(new Game.Player("Samantha", "255,85,135"));
		Game.play.registerPlayer(new Game.Player("God", "68,170,170"));
		Game.data.AI.push(new Game.AI(Game.data.players[1], 0.8));
		Game.data.AI.push(new Game.AI(Game.data.players[2], 1));
		// Game.play.registerPlayer(new Game.Player("Bob", "68,170,170"));
		// Game.play.registerPlayer(new Game.Player("Charlie", "68,153,255"));

		this.nextRound();
		
	},

	nextRound : function()
	{
		document.querySelector(".timer").classList.remove("timerOn");
		setTimeout(function() {
			if (Game.data.round <= Game.data.roundLimit){
				document.querySelector(".gamePanels .round").innerHTML = ++Game.data.round;
				Game.play.newRound(Game.play.nextRound);
			}
		}, 200);
		
	},

	newRound : function(callback)
	{
		Game.play.generateCards(Game.front.revealCards);
		var timer = document.querySelector(".timer");
		timer.classList.add("timerOn");
		timer.innerHTML = 5;
		var interval = setInterval(function()
		{
			if (timer.innerHTML < 2){
				clearInterval(interval);
				callback();
			}
			timer.innerHTML--;
		}, 1000);
	},

	registerPlayer : function(player)
	{
		if (player != undefined)
			Game.data.players.push(player);
		Game.front.revealPlayer(player);
	},

	generateCards : function(callback)
	{
		// Common cards
		for (var i = 0; i < 7; i++) 
		{
			Game.data.gameCards[i] = new Game.Card(
				Game.Alphabet.random()
			);
		}

		// Player cards
		for (var i = 0; i < Game.data.players.length; i++) {
			Game.data.players[i].cards([ 
				new Game.Card( Game.Alphabet.random(), Game.data.players[i].color ),
				new Game.Card( Game.Alphabet.random(), Game.data.players[i].color )
			]);
		}

		callback();
	},

	confirmWord : function()
	{
		var word = Game.data.players[0].word;
		var search = Game.data.wordlist.find(word);
		if ( search!= null)
			console.log(search, Game.data.wordlist.value(word));
		else 
			console.log(search, "Not a word.")

		for (var i = 0; i < Game.data.AI.length; i++) {
			Game.data.AI[i].chooseWord();
		}
		Game.front.updateWords(Game.front.updateScores);
		Game.front.gamePanel.updateWordlist();
	}

}

Game.front = {
	init : function()
	{
		this.loadAudio(Game.data.audioPath);
		this.listener.init();
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
		}
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

	updateMyScore : function(callback)
	{
		var score = 0;
		for (var i = 0, length = Game.data.players[0].word.length; i < length ; i++) {
			score += Game.Alphabet.value[ Game.data.players[0].word[i] ]; 
		}
		Game.data.players[0].score = score;
		document.querySelector(".player[name='"+ Game.data.players[0].name +"'] .score").innerHTML = score;
		
		// console.log(Game.data.players[0].word, Game.data.players[0].score )
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

			var myCombinations = Game.data.players[0].myLetters().combinations();
			var choices = Game.data.wordlist.bulkValue(Game.data.wordlist.bulkFind(myCombinations, true));

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
		}


	},

	listener : {
		init : function(){
			this.soundBtn();
			this.kbdShortcuts();
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
		}


	}


}



Game.classExtender =
{
	stringExtender : (function() {
		String.prototype.combinations = function() {
			var str = this;
			var fn = function(active, rest, a) 
			{
				if (!active && !rest)
					return;
				if (!rest) 
					a.push(active);
				else 
				{
					fn(active + rest[0], rest.slice(1), a);
					fn(active, rest.slice(1), a);
				}
				return a;
			}
			return fn("", str, []);
		};

		String.prototype.element = function() {
		    var d = document.createElement('div');
			d.innerHTML = this;
			return d.firstChild;
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

	random : function()
	{
		return Game.Alphabet.array[ Math.round( Math.random() * ( Game.Alphabet.array.length-1 ) ) ];
	},

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
		var search = wordlist.bulkFind(this.player.myLetters().combinations());
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
	this.score = 0;
}

Game.Player.prototype = {
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

		var results = results.filter(function(item, pos, self) {
		    return item.length > 2;
		})

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

