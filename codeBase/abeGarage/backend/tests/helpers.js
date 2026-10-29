// Shared helpers for the API tests.
const request = require("supertest");
const knex = require("knex");
const app = require("../app");
const db = require("../config/db.config");

const PASSWORD = "GarageHub-demo-1";
const ROLES = ["admin", "manager", "mechanic", "demo"];

const api = () => request(app);

const login = async (role) => {
  const res = await api()
    .post("/api/employee/login")
    .send({ employee_email: `${role}@garagehub.test`, employee_password: PASSWORD });
  if (res.status !== 200) throw new Error(`login ${role} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
};

const loginAll = async () => {
  const tokens = {};
  for (const role of ROLES) tokens[role] = await login(role);
  return tokens;
};

// One row of seeded data to use as realistic ids in requests.
const sampleIds = async () => {
  const [vehicle] = await db("SELECT vehicle_id, customer_id FROM customer_vehicle_info ORDER BY vehicle_id LIMIT 1");
  const [order] = await db("SELECT order_id, order_hash FROM orders ORDER BY order_id LIMIT 1");
  const [service] = await db("SELECT service_id FROM common_services ORDER BY service_id LIMIT 1");
  const [employee] = await db(
    "SELECT employee_id FROM employee WHERE employee_email = 'mechanic@garagehub.test'"
  );
  return {
    customerId: vehicle.customer_id,
    vehicleId: vehicle.vehicle_id,
    orderId: order.order_id,
    orderHash: order.order_hash,
    serviceId: service.service_id,
    employeeId: employee.employee_id,
  };
};

// Re-run the demo seed (deletes and re-inserts all app data).
const resetDb = async () => {
  const k = knex({
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    seeds: { directory: `${__dirname}/../db/seeds` },
  });
  await k.seed.run();
  await k.destroy();
};

const closeDb = () => db.pool.end();

module.exports = { api, app, db, login, loginAll, sampleIds, resetDb, closeDb, PASSWORD, ROLES };
