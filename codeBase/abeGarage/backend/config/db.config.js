// import mysql from 'mysql2/promise';
const mysql = require('mysql2/promise');
// define connection parameters
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 10
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


