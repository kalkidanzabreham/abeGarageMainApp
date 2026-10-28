// import mysql from 'mysql2/promise';
const mysql = require("mysql2/promise");
// define connection parameters
const pool = mysql.createPool({
  connectionLimit: 10,
  password: process.env.DB_PASS,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
});

// create query function
// pool.query() checks a connection out and always releases it, even when the
// query throws. The previous version released manually and leaked the
// connection on every failed query, so 10 errors exhausted the pool.
const query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Run several statements atomically on ONE connection.
// `work` receives a query function bound to that connection. If it throws,
// everything is rolled back and the error is re-thrown to the caller.
// (A "START TRANSACTION" sent through the pool does not work: each pool
// query can land on a different connection.)
const withTransaction = async (work) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const txQuery = async (sql, params) => {
      const [rows] = await conn.query(sql, params);
      return rows;
    };
    const result = await work(txQuery);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = query;
module.exports.withTransaction = withTransaction;
module.exports.pool = pool;
