<?php

	require_once("wordlist.php");

	class Game
	{
		// DB connection context
		var $conn;

		// wordlist instance
		var $wordlist;

		// Output variables
		// query result row
		var $row;
		// query intention boolean
		var $result;
		// query error message
		var $error; 
		// query string itself
		var $query; 

		/**
		 * Game constructor
		 * @param DbContext conn - Active MySQLi database connection
		 */
		
		function __construct($conn)
		{
			$this->conn = $conn;
			$this->wordlist = new Wordlist($conn);
		}


		function getRoundDetails($gameid)
		{
			$query = "SELECT * FROM ROUND WHERE GAME_ID='$gameid' ORDER BY NUMBER DESC";
			if ($result = $this->conn->query($query)) 
			{
				$row = $result->fetch_assoc();
			    $result->close();

			    $this->result = 'true';	
			    $this->row = $row;	
				return $row;
				// return $this;
			}
		    $this->result = 'false';	
			$this->error = $this->conn->error;
			return null;
			return $this;
		}


		function getGameDeck($gameid)
		{
			$query = "SELECT deck FROM GAME WHERE ID='$gameid'";
			if ($result = $this->conn->query($query)) 
			{
				$row = $result->fetch_assoc();
				return $row["deck"];
			}
			return $this->conn->error;
		}


		function updateGameDeck($gameid, $deck)
		{
			$query = "UPDATE GAME SET deck='$deck' WHERE id='$gameid'";
			if ($result = $this->conn->query($query)) 
			{
				return $result;
			}
			return $this->conn->error;
		}


		function nextRound($gameid, $number)
		{
			$deck = $this->getGameDeck($gameid);
			$word = $this->wordlist->randomWord($deck, 15);
			$this->updateGameDeck($gameid, $deck);

			$query = "INSERT INTO ROUND (GAME_ID, NUMBER, LETTERS) VALUES ( '$gameid', '$number', '$word' )";
			$this->query = $query;
			if ($result = $this->conn->query($query)) 
			{
				$this->result = "true";
				return $result;
			}
		    $this->result = 'false';	
			$this->error = $this->conn->error;
			return $this->error;
		}



		function getParticipants($gameid)
		{
			$query = "SELECT USER.TOKEN, USER.NAME, USER.ID, PARTICIPANT.GAME_ID FROM USER JOIN PARTICIPANT WHERE PARTICIPANT.GAME_ID='$gameid' AND USER.ID = PARTICIPANT.USER_ID ";
			if ($result = $this->conn->query($query)) 
			{
				$row = mysqli_fetch_all($result,MYSQLI_ASSOC);;
			    $result->close();
				$this->result = "true";
			    $this->row = $row;	
				return $this;
			}
		    $this->result = 'false';	
			$this->error = $this->conn->error;
			return $this;
		}


		function checkWords($words)
		{
			$results = array();
			for ($i=0; $i < count($words); $i++) 
			{ 
				$userid = $words[$i]->userid;
				$word = $words[$i]->word;

				$query = "SELECT 1 FROM WORDS WHERE word='$word'";
				if ($result = $this->conn->query($query)) 
				{
					$row = $result->fetch_assoc();
					if ($row != null)
						$words[$i]->exists = "true";
					else
						$words[$i]->exists = "false";
				}
				else
				{
					// error check
				}

				$results[$userid] = array(
					"userid" => $userid,
					"word" => $word,
					"exists" => $words[$i]->exists,
					"exists" => $words[$i]->exists
				);
			}

			return $results;
		}


		function createGame($request)
		{
			// Create Game
			$playerIds = $request["players"];
			$player_count = count($playerIds);
			$round_count = $request["roundCount"];
			$deck = $this->wordlist->deck();

			$query = "INSERT INTO GAME (PLAYER_COUNT, ROUND_COUNT, DECK) VALUES ( '$player_count', '$round_count', '$deck')";

			if ($result = $this->conn->query($query)) 
			{
				$gameid = $this->conn->insert_id;
				$this->addParticipants($playerIds, $gameid);
				$this->nextRound($gameid, 1);
				return $gameid;
			}
		    $this->result = 'false';	
			$this->error = $this->conn->error;
			return false;
		}


		function addParticipants($userids, $gameid)
		{
			// Build insert query
			$query = "INSERT INTO PARTICIPANT (USER_ID, GAME_ID) VALUES ";
			for ($i=0; $i < count($userids); $i++) 
			{ 
				$query = $query . "('$userids[$i]', '$gameid'),";
			}
			$query = rtrim($query, ",") . ";";


			// Execute Insert query
			if ($result = $this->conn->query($query)) 
			{
				return true;
			}
		    $this->result = 'false';	
			$this->error = $this->conn->error;
			return false;
		}



		/**
		 * returns query variables in its original form assembled in an array
		 */
		function rows()
		{
			return array("query" => $this->query, "data" => $this->row, "result" => $this->result, "error" => $this->error);
		}



		/**
		 * returns query variables assembled in json
		 */
		function json()
		{
			header('Content-Type: application/json; charset=utf8');
			return json_encode(array("query" => $this->query, "result" => $this->result, "data" => $this->row, "error" => $this->error ));
		}

		/**
		 * Clears query variables
		 *
		 */
		
		public function clear()
		{
			$this->result = null;
			$this->query = null;
			$this->row = null;
			$this->error = null;
		}


		// Clear query variables before anything is called
		public function __call($method,$arguments) {
	        if(method_exists($this, $method)) {
	            $this->clear();
	            return call_user_func_array(array($this,$method),$arguments);
	        }
	    }
	}