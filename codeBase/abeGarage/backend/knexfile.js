// Knex is used ONLY for schema migrations and seed data.
// Application queries still go through mysql2 (config/db.config.js).
// Reads the DB settings directly so migrations don't need app secrets.
require("dotenv").config();
const { dbSsl } = require("./config/dbSsl");

module.exports = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: dbSsl(),
  },
  migrations: { directory: "./db/migrations", tableName: "knex_migrations" },
  seeds: { directory: "./db/seeds" },
};
