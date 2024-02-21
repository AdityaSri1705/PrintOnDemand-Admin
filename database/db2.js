const mysql = require('mysql');
require("dotenv").config();

// Create a connection 
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  
  // Create a promise-based query function
  const query = (sql, values) => {
    connection.query('SELECT * FROM your_table', (error, results, fields) => {
        if (error) {
          return error;
        }
        return results;
    });
  };
  
  module.exports = {
    query,
  };