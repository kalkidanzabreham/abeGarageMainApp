// Runs once before all test files: fresh database, all migrations, demo seed.
const knex = require("knex");
const { applyTestEnv } = require("./testEnv");

module.exports = async () => {
  const env = applyTestEnv();
  const connection = {
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASS,
  };
  const server = knex({ client: "mysql2", connection });
  await server.raw("DROP DATABASE IF EXISTS ??", [env.DB_NAME]);
  await server.raw("CREATE DATABASE ??", [env.DB_NAME]);
  await server.destroy();

  const db = knex({
    client: "mysql2",
    connection: { ...connection, database: env.DB_NAME },
    migrations: { directory: `${__dirname}/../db/migrations` },
    seeds: { directory: `${__dirname}/../db/seeds` },
  });
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
};
