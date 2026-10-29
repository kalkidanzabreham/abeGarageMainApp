// Migration 005 (status 3 -> 2) up and down, in its own throwaway database so
// the shared test database is never rolled back.
const knex = require("knex");

const DB = `${process.env.DB_NAME}_migrations`;
const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};
let server;
let db;

beforeAll(async () => {
  server = knex({ client: "mysql2", connection });
  await server.raw("DROP DATABASE IF EXISTS ??", [DB]);
  await server.raw("CREATE DATABASE ??", [DB]);
  db = knex({
    client: "mysql2",
    connection: { ...connection, database: DB },
    migrations: { directory: `${__dirname}/../db/migrations` },
    seeds: { directory: `${__dirname}/../db/seeds` },
  });
});
afterAll(async () => {
  await db.destroy();
  await server.raw("DROP DATABASE IF EXISTS ??", [DB]);
  await server.destroy();
});

const statuses = async () =>
  Object.fromEntries((await db("order_status").select("order_id", "order_status")).map((r) => [r.order_id, r.order_status]));

test("every migration runs up and down on an empty database", async () => {
  await db.migrate.latest();
  const [, applied] = await db.migrate.list();
  expect(applied).toHaveLength(0); // nothing pending
  await db.migrate.rollback(undefined, true); // all the way down
  const [tables] = await db.raw("SHOW TABLES");
  expect(tables.map((t) => Object.values(t)[0]).sort()).toEqual(["knex_migrations", "knex_migrations_lock"]);
  await db.migrate.latest();
});

test("005 converts status 3 to 2, and down restores only the converted rows", async () => {
  await db.seed.run();
  await db.migrate.down(); // undo 005
  const orderIds = Object.keys(await statuses()).map(Number);
  await db("order_status").where({ order_id: orderIds[0] }).update({ order_status: 3 });
  const before = await statuses();

  await db.migrate.up(); // 005
  const after = await statuses();
  expect(after[orderIds[0]]).toBe(2);
  expect(Object.values(after)).not.toContain(3);

  await db.migrate.down();
  expect(await statuses()).toEqual(before);
  await db.migrate.up();
});
