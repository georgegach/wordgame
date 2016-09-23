<?php
header('Access-Control-Allow-Origin: *'); 
	require 'vendor/autoload.php';
	require 'wordlist.php';
	require 'user.php';
	require 'db.php';
	require 'game.php';

	$db = new Db();
	$user = new User($db->context());
	$game = new Game($db->context());
	$wordlist = new Wordlist($db->context());
	 
	$app = new Slim\Slim();
	$redis = new Predis\Client();


	$app->get('/api/sample', function() use ($redis, $user, $game, $app, $wordlist) 
	{
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');
		
		// echo $game->createGame(array("players" => "4", "roundCount" => "3"));
		echo json_encode($game->getGameDeck("94"));
	});

	/**
	 *
	 * CLIENT
	 *
	 */

	// Register Client in User Table
	$app->get('/client/register/:name', function($name) use ($app, $user) {
		// echo $name;
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');
	    echo $user->registerUser($name)->json();
	});

	// Get user by token
	$app->get('/client/get/:token', function($token) use ($app, $user) {
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');
	    echo $user->get($token)->json();
	});

	// Create new game
	$app->get('/client/game/create/:request', function($request) use ($app, $user, $game, $redis) {
		// Create Game
		$request = json_decode($request);
		$gameid = $game->createGame($request);

		// Respond
		$app->response->headers->set('Content-Type', 'application/json');
		if ($gameid != false)
		{
			echo json_encode(array( 
				"gameid" => $gameid
			));
		}
		else
		{
			echo $game->json();
		}

	});

		// Check if the word exists
	$app->get('/client/check/:words', function($words) use ($app, $user, $game, $redis) {
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');

		// Create Game
		$words = json_decode($words);
		$array = $game->checkWords($words);

		// Respond
		echo json_encode($array);
	});

	// Request current round details
	$app->get('/client/round/:gameid', function($gameid) use ($app, $user, $game, $redis) {
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');
	    echo json_encode($game->getRoundDetails($gameid));
	});

	// Increment round by one
	$app->get('/client/nextround/:gameid/:number', function($gameid, $number) use ($app, $user, $game, $redis) {
		$app->response->headers->set('Content-Type', 'application/json;charset=utf-8');
	    echo json_encode($game->nextRound($gameid, $number));
	});



 
	/**
	 *
	 * HELPER
	 *
	 */





	$app->run();

