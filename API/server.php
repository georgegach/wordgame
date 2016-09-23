<?php
	require 'wordlist.php';
	require 'user.php';
	require 'db.php';
	require 'game.php';

	$db = new Db();

	 

	/**
	 *
	 * create game
	 *
	 */
	
	if (isset($_GET["creategame"]))
	{
		$creator = $_GET["creator"];
		$playercount = $_GET["playercount"];
		$roundcount = $_GET["roundcount"];
		
		$game = new Game($db->context());
		echo $game->create($creator, $playercount, $roundcount)->getAll()->json();
	}


	/**
	 *
	 * add participant
	 *
	 */
	
	if (isset($_GET["addgamer"]))
	{
		$gameid = $_GET["gameid"];
		$userid = $_GET["userid"];
		
		$game = new Game($db->context());
		echo $game->addParticipant($gameid, $userid)->getAll()->json();
	}


	/**
	 *
	 * add round
	 *
	 */
	
	if (isset($_GET["addround"]))
	{
		$gameid = $_GET["gameid"];
		$roundnumber = $_GET["roundnumber"];
		$letters = $_GET["letters"];
		$exp_date = $_GET["exp_date"];
		
		$game = new Game($db->context());
		echo $game->addRound($gameid, $roundnumber, $letters, $exp_date)->getAllRoundsForGame($gameid)->json();
	}



	/**
	 *
	 * Get concrete user details
	 *
	 */
	
	if (isset($_GET["adduser"]))
	{
		$name = $_GET["name"];
		$token = $_GET["token"];
		
		$user = new User($db->context());

		echo $user->add($name, $token)->getAll()->json();
	}


	/**
	 *
	 * Get concrete user details
	 *
	 */
	
	if (isset($_GET["user"]))
	{
		$name = $_GET["name"];
		$token = $_GET["token"];
		
		$user = new User($db->context());

		echo $user->get($user, $token)->json();
	}


	/**
	 *
	 * get everyone
	 *
	 */
	
	if (isset($_GET["everyone"]))
	{
		$user = new User($db->context());
		echo $user->getAll()->json();
	}

	/**
	 *
	 * get everygame
	 *
	 */
	
	if (isset($_GET["everygame"]))
	{
		$game = new Game($db->context());
		echo $game->getAll()->json();
	}

	/**
	 *
	 * get everygame
	 *
	 */
	
	if (isset($_GET["everygamer"]))
	{
		$game = new Game($db->context());
		echo $game->getEveryGamer()->json();
	}

	/**
	 *
	 * check word for existance
	 *
	 */
	
	if (isset($_GET["exists"]))
	{
		$word = $_GET["exists"];
		
		$wordlist = new Wordlist($db->context());
		echo $wordlist->wordExists($word);
	}

	/**
	 *
	 * get every word containing X
	 *
	 */
	
	if (isset($_GET["contains"]))
	{
		$word = $_GET["contains"];
		$wordlist = new Wordlist($db->context());

		if (isset($_GET["mode"]) && $_GET["mode"] == "json")
			$wordlist->contains($word)->json();
		else
			$wordlist->contains($word)->preprint();
	}
	

	
