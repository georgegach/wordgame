<?php


	class DB 
	{

		var $conn;

		function __construct()
		{
			$this->connect();
		}

		/**
		 * Handles connection establishment to the database
		 */
		function connect()
		{
			$this->conn = new mysqli("localhost", "root", "", "game");
			$this->conn->set_charset("utf8");

			if (mysqli_connect_errno()) 
			{
			    printf("Connection failed: %s\n", mysqli_connect_error());
			    exit();
			}
		}


		function context()
		{
			return $this->conn;
		}


		/**
		 * Handles disconnection from the database
		 */
		function disconnect()
		{
			$this->conn->close();
		}

	}