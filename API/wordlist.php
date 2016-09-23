<?php

class Wordlist 
{
	var $conn;
	var $row;

	function Wordlist($conn)
	{
		$this->conn = $conn;
	}


	/**
	 * Checks the word for existance in the database
	 * @return 	Boolean - True/False 
	 */
	function wordExists($word)
	{
		$query = "SELECT * FROM WORDS WHERE word = '" . $word . "'";
		
		if ($result = $this->conn->query($query)) 
		{
			$row = $result->fetch_all();
			$result->close();

			if (count($row) > 0)
				return 'true';
			return 'false';
		}
	}


	/**
	 * Returns the list of words containing the fragment of the word
	 * @param 	String  - 	word fragment
	 * @return 	Array() -	list of words containing word fragment
	 */
	function contains($fragment)
	{
		$query = "SELECT * FROM WORDS WHERE word LIKE '%" . $fragment . "%'";
		if ($result = $this->conn->query($query)) 
		{
			$row = $result->fetch_all();
			$result->close();
			$this->row = $row;	
			return $this;
		}
	}

	/**
	 * Returns the list of cards AKA a deck
	 * @return 	String -	list of letters (cards);
	 */
	function deck()
	{
		return "ააააააააბბგგდდდეეეეევვზთთიიიიიიიკლლლლმმმნნნოოოოოპჟრრრრსსსსტტუუუუფფქქღყშშჩჩცძწჭხჯჰ***";
	}


	/**
	 * Choose random X
	 * @param String deck 	- deck of letters  
	 * @param Int  X		- Random word containing X number of letters  
	 * @return 	String  	- list of letters (cards);
	 */
	function randomWord(&$deck, $x)
	{
		$deck = $this->mb_str_shuffle($deck);
		$word = mb_substr($deck, 0, $x);
		$deck = $this->str_replace_first($word, "", $deck);
		return $word;
	}

		function mb_str_shuffle($str)
		{
			$arr = preg_split('//u', $str, -1, PREG_SPLIT_NO_EMPTY);
			shuffle($arr);
			return implode('', $arr);
			// return mb_convert_encoding(implode('', $arr), "UTF-8");
		}

		function str_replace_first($from, $to, $subject)
		{
		    $from = '/'.preg_quote($from, '/').'/';
		    return preg_replace($from, $to, $subject, 1);
		}

	/**
	 * Prints the content of $row
	 */
	function preprint()
	{
		echo "<pre>";
		print_r($this->row);
		echo "</pre>";
	}

	/**
	 * returns json
	 */
	function json()
	{
		header('Content-Type: application/json; charset=utf8');
		echo json_encode($this->row);
	}


}