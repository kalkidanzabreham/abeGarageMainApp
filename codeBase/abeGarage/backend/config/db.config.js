// import mysql from 'mysql2/promise';
const mysql = require("mysql2/promise");
// define connection parameters
const connection = mysql.createPool({
  connectionLimit: 10,
  password: process.env.DB_PASS,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
});

// create query function
const query = async (sql, params) => {
  // get connection from pool
  const conn = await connection.getConnection();
  // execute query
  const [rows] = await conn.query(sql, params);
  // release connection
  conn.release();
  return rows;
};

module.exports = query;
