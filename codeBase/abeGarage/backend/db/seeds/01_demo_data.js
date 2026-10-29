// Demo data: one account per role plus fake customers, vehicles, services
// and orders. All of it is fictional (.test / example.com addresses,
// 555-01xx phone numbers). Run with: npm run seed
//
// This REPLACES all application data, so it refuses to run with
// NODE_ENV=production unless SEED_ALLOW_PRODUCTION=true (e.g. for a public
// demo deploy). Passwords come from SEED_*_PASSWORD env vars; see
// db/seedPasswords.js (only the Demo account's password may be public).
require("dotenv").config();
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const { ROLES } = require("../../config/roles");
const { seedPasswords } = require("../seedPasswords");

const isProduction = process.env.NODE_ENV === "production";

const ACCOUNTS = [
  { key: "admin", email: "admin@garagehub.test", first: "Ada", last: "Admin", role: ROLES.ADMIN },
  { key: "manager", email: "manager@garagehub.test", first: "Maya", last: "Manager", role: ROLES.MANAGER },
  { key: "mechanic", email: "mechanic@garagehub.test", first: "Mo", last: "Mechanic", role: ROLES.MECHANIC },
  { key: "demo", email: "demo@garagehub.test", first: "Dee", last: "Demo", role: ROLES.DEMO },
];

const SERVICES = [
  ["Oil change", "Engine oil and filter replacement", 49.99],
  ["Brake pad replacement", "Front or rear brake pads, per axle", 149.0],
  ["Brake disc resurfacing", "Machine rotors to remove scoring", 89.5],
  ["Wheel balancing", "Balance all four wheels", 39.0],
  ["Wheel alignment", "Four-wheel alignment check and adjust", 79.0],
  ["Battery replacement", "Test and replace 12V battery", 129.0],
  ["Diagnostic scan", "OBD-II fault code read and report", 59.0],
  ["Suspension inspection", "Shocks, struts, bushings and links", 69.0],
];

const CUSTOMERS = [
  ["Liam", "Carter", "liam.carter@example.com", "555-0101"],
  ["Sofia", "Nguyen", "sofia.nguyen@example.com", "555-0102"],
  ["Noah", "Okafor", "noah.okafor@example.com", "555-0103"],
  ["Emma", "Haile", "emma.haile@example.com", "555-0104"],
  ["Lucas", "Moreno", "lucas.moreno@example.com", "555-0105"],
];

// [customer index, year, make, model, type, mileage, tag, serial, color]
const VEHICLES = [
  [0, 2016, "Toyota", "Corolla", "Sedan", 98000, "DEMO-001", "SER-0001", "White"],
  [0, 2020, "Honda", "CR-V", "SUV", 41000, "DEMO-002", "SER-0002", "Grey"],
  [1, 2018, "Ford", "Focus", "Hatchback", 76000, "DEMO-003", "SER-0003", "Blue"],
  [2, 2014, "Volkswagen", "Golf", "Hatchback", 132000, "DEMO-004", "SER-0004", "Black"],
  [3, 2021, "Hyundai", "Tucson", "SUV", 22000, "DEMO-005", "SER-0005", "Red"],
  [4, 2012, "Nissan", "Navara", "Pickup", 185000, "DEMO-006", "SER-0006", "Silver"],
];

// [vehicle index, employee email, status, [service indexes], [completed flags]]
// status: 0 = received, 1 = in progress, 2 = completed
const ORDERS = [
  [0, "manager@garagehub.test", 2, [0, 3], [1, 1]],
  [2, "manager@garagehub.test", 1, [1, 2], [1, 0]],
  [3, "admin@garagehub.test", 0, [6, 7], [0, 0]],
  [4, "manager@garagehub.test", 1, [0, 4], [0, 0]],
  [5, "admin@garagehub.test", 0, [5], [0]],
];

// child tables first so foreign keys are never violated
const TABLES = [
  "order_status", "order_services", "order_info", "orders",
  "customer_vehicle_info", "customer_info", "customer_identifier",
  "employee_role", "employee_pass", "employee_info", "employee",
  "common_services",
];

exports.seed = async (knex) => {
  if (isProduction && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error("Refusing to seed with NODE_ENV=production (set SEED_ALLOW_PRODUCTION=true to override)");
  }
  // throws before touching any data if a password is missing or weak
  const passwords = seedPasswords();
  const hashes = {};
  for (const a of ACCOUNTS) hashes[a.key] = await bcrypt.hash(passwords[a.key], 10);

  await knex.transaction(async (trx) => {
    for (const table of TABLES) {
      await trx(table).del();
    }

    const employeeIds = {};
    for (const a of ACCOUNTS) {
      const [id] = await trx("employee").insert({ employee_email: a.email, active_employee: 1 });
      employeeIds[a.email] = id;
      await trx("employee_info").insert({
        employee_id: id, employee_first_name: a.first, employee_last_name: a.last, employee_phone: "555-0100",
      });
      await trx("employee_pass").insert({ employee_id: id, employee_password_hashed: hashes[a.key] });
      await trx("employee_role").insert({ employee_id: id, company_role_id: a.role });
    }

    const serviceRows = [];
    for (const [name, description, price] of SERVICES) {
      const [id] = await trx("common_services").insert({
        service_name: name, service_description: description, service_price: price,
      });
      serviceRows.push({ id, price });
    }

    const customerIds = [];
    for (const [first, last, email, phone] of CUSTOMERS) {
      const [id] = await trx("customer_identifier").insert({
        customer_email: email, customer_phone_number: phone, customer_hash: randomUUID(),
      });
      await trx("customer_info").insert({
        customer_id: id, customer_first_name: first, customer_last_name: last, active_customer_status: 1,
      });
      customerIds.push(id);
    }

    const vehicles = [];
    for (const [c, year, make, model, type, mileage, tag, serial, color] of VEHICLES) {
      const [id] = await trx("customer_vehicle_info").insert({
        customer_id: customerIds[c], vehicle_year: year, vehicle_make: make, vehicle_model: model,
        vehicle_type: type, vehicle_mileage: mileage, vehicle_tag: tag, vehicle_serial: serial, vehicle_color: color,
      });
      vehicles.push({ id, customerId: customerIds[c] });
    }

    for (const [v, email, status, serviceIdx, completed] of ORDERS) {
      const [orderId] = await trx("orders").insert({
        employee_id: employeeIds[email], customer_id: vehicles[v].customerId, vehicle_id: vehicles[v].id,
        active_order: status === 2 ? 0 : 1, order_hash: randomUUID(),
      });
      // same rule as the API: total = sum of catalog prices
      const total = serviceIdx.reduce((sum, i) => sum + serviceRows[i].price, 0);
      await trx("order_info").insert({
        order_id: orderId, order_total_price: total.toFixed(2),
        additional_requests_completed: 0,
        completion_date: status === 2 ? knex.fn.now() : null,
      });
      for (let k = 0; k < serviceIdx.length; k++) {
        await trx("order_services").insert({
          order_id: orderId, service_id: serviceRows[serviceIdx[k]].id, service_completed: completed[k],
        });
      }
      await trx("order_status").insert({ order_id: orderId, order_status: status });
    }
  });

  console.log(`Seeded ${ACCOUNTS.length} accounts (${ACCOUNTS.map((a) => a.email).join(", ")}), ` +
    `${SERVICES.length} services, ${CUSTOMERS.length} customers, ${VEHICLES.length} vehicles, ${ORDERS.length} orders.`);
};
