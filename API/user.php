<?php

	class User 
	{
		// DB connection context
		var $conn;

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
		 * User constructor
		 * @param DbContext conn - Active MySQLi database connection
		 */
		
		function __construct($conn)
		{
			$this->conn = $conn;
		}

		function registerUser($name, $salt = "")
		{
			$token = md5($name + microtime() + $salt);

			if ($this->add($name, $token))
			{
				return $this->get($token);
			}
			else
			{
				$this->registerUser($name, $token);
			}
		}

	
		function add($name, $token)
		{
			$query = "INSERT INTO USER (TOKEN, NAME) VALUES ('$token', '$name')";
			if ($result = $this->conn->query($query)) 
				return true;
			$this->error = $this->conn->error;
			return false;
		}

		function get($token)
		{
			$query = "SELECT * FROM USER WHERE token='" . $token . "'";
			if ($result = $this->conn->query($query)) 
			{
				$row = $result->fetch_assoc();
			    $result->close();
			    $this->row = $row;	
				return $this;
			}
		}

		function getAll()
		{
			$query = "SELECT * FROM USER";
			if ($result = $this->conn->query($query)) 
			{
				$row = mysqli_fetch_all($result,MYSQLI_ASSOC);;
			    $result->close();
			    $this->row = $row;	
				return $this;
			}
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

?>