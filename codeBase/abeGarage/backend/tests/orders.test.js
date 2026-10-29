// Core service-order flow: customer -> vehicle -> order -> update -> tracking.
// Covers server-side totals, ownership rules and the data the UI fixes rely
// on (creator name in the list, prices + total on one order, status values).
const { api, db, loginAll, resetDb, closeDb } = require("./helpers");

let tokens;
let prices; // service_name -> { id, price }
let customerId;
let vehicleId;
let orderId;
let orderHash;

const as = (role, method, path) => api()[method](path).set("x-access-token", tokens[role]);

beforeAll(async () => {
  await resetDb();
  tokens = await loginAll();
  const rows = await db("SELECT service_id, service_name, service_price FROM common_services");
  prices = Object.fromEntries(rows.map((r) => [r.service_name, { id: r.service_id, price: r.service_price }]));
});
afterAll(closeDb);

describe("order flow", () => {
  test("probe 3: manager adds a customer (customer_hash is generated)", async () => {
    const res = await as("manager", "post", "/api/customers").send({
      customer_email: "flow.test@example.com", customer_first_name: "Flow", customer_last_name: "Test",
      customer_phone_number: "555-0150",
    });
    expect(res.status).toBe(201);
    customerId = res.body.customer.customer_id;
    const [row] = await db("SELECT customer_hash FROM customer_identifier WHERE customer_id = ?", [customerId]);
    expect(row.customer_hash).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("a duplicate customer email is a 409", async () => {
    const res = await as("manager", "post", "/api/customers").send({
      customer_email: "flow.test@example.com", customer_first_name: "Again",
    });
    expect(res.status).toBe(409);
  });

  test("manager adds a vehicle for that customer (string numbers are coerced)", async () => {
    const res = await as("manager", "post", `/api/addvehicle/${customerId}`).send({
      vehicle_year: "2019", vehicle_make: "Mazda", vehicle_model: "CX-5", vehicle_type: "SUV",
      vehicle_mileage: "61000", vehicle_tag: "FLOW-1", vehicle_serial: "S-1", vehicle_color: "Blue",
    });
    expect(res.status).toBe(201);
    expect(typeof res.body.vehicle_id).toBe("number");
    vehicleId = res.body.vehicle_id;
  });

  test("order total is computed on the server; client total and employee_id are ignored", async () => {
    const [mechanic] = await db("SELECT employee_id FROM employee WHERE employee_email = 'mechanic@garagehub.test'");
    const res = await as("manager", "post", "/api/order").send({
      customer_id: customerId, vehicle_id: vehicleId,
      order_total_price: 1, employee_id: mechanic.employee_id,
      estimated_completion_date: "2026-11-03T15:30",
      order_services: [{ service_id: prices["Oil change"].id }, { service_id: prices["Brake pad replacement"].id }],
    });
    expect(res.status).toBe(201);
    const expected = prices["Oil change"].price + prices["Brake pad replacement"].price;
    expect(res.body.order_total_price).toBeCloseTo(expected, 2);
    orderId = res.body.order_id;

    const [row] = await db(
      `SELECT o.order_hash, oi.order_total_price, os.order_status, e.employee_email
       FROM orders o JOIN order_info oi USING (order_id) JOIN order_status os USING (order_id)
       JOIN employee e USING (employee_id) WHERE o.order_id = ?`, [orderId]);
    expect(row.order_total_price).toBeCloseTo(expected, 2);
    expect(row.employee_email).toBe("manager@garagehub.test"); // from the token
    expect(row.order_status).toBe(0);
    orderHash = row.order_hash;
  });

  test("a vehicle that belongs to another customer is rejected", async () => {
    const [other] = await db("SELECT vehicle_id FROM customer_vehicle_info WHERE customer_id <> ? LIMIT 1", [customerId]);
    const res = await as("manager", "post", "/api/order").send({
      customer_id: customerId, vehicle_id: other.vehicle_id, order_services: [{ service_id: prices["Oil change"].id }],
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Vehicle does not belong to this customer");
  });

  test("an unknown service id is rejected", async () => {
    const res = await as("manager", "post", "/api/order").send({
      customer_id: customerId, vehicle_id: vehicleId, order_services: [{ service_id: 999999 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unknown service id(s): 999999");
  });

  test("bug 2: the order list carries customer, vehicle and creator name", async () => {
    const res = await as("mechanic", "get", "/api/orders");
    expect(res.status).toBe(200);
    const order = res.body.data.find((o) => o.order_id === orderId);
    expect(order).toMatchObject({
      customer_first_name: "Flow", vehicle_make: "Mazda",
      employee_first_name: "Maya", employee_last_name: "Manager",
    });
    expect(order.order_services).toHaveLength(2);
  });

  test("bug 3: one order returns its total and each service's price", async () => {
    const res = await as("admin", "get", `/api/order/${orderId}`);
    expect(res.status).toBe(200);
    const [order] = res.body;
    expect(order.order_total_price).toBeCloseTo(prices["Oil change"].price + prices["Brake pad replacement"].price, 2);
    expect(order.order_services.map((s) => s.service_price).sort()).toEqual(
      [prices["Oil change"].price, prices["Brake pad replacement"].price].sort()
    );
  });

  test("update uses the URL id, syncs services and recomputes the total", async () => {
    const [other] = await db("SELECT order_id FROM orders WHERE order_id <> ? LIMIT 1", [orderId]);
    const otherBefore = await db(
      "SELECT os.order_status, oi.order_total_price FROM order_status os JOIN order_info oi USING (order_id) WHERE order_id = ?",
      [other.order_id]
    );
    const res = await as("mechanic", "put", `/api/order/${orderId}`).send({
      order_id: other.order_id, // ignored: the URL decides which order changes
      order_completed: 1,
      order_services: [
        { service_id: prices["Brake pad replacement"].id, service_completed: 1 },
        { service_id: prices["Wheel balancing"].id },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.order_total_price).toBeCloseTo(prices["Brake pad replacement"].price + prices["Wheel balancing"].price, 2);

    const services = await db("SELECT service_id, service_completed FROM order_services WHERE order_id = ? ORDER BY service_id", [orderId]);
    expect(services).toEqual(
      [
        { service_id: prices["Brake pad replacement"].id, service_completed: 1 },
        { service_id: prices["Wheel balancing"].id, service_completed: 0 },
      ].sort((a, b) => a.service_id - b.service_id)
    );
    // the order named in the body was not touched
    const otherAfter = await db(
      "SELECT os.order_status, oi.order_total_price FROM order_status os JOIN order_info oi USING (order_id) WHERE order_id = ?",
      [other.order_id]
    );
    expect(otherAfter).toEqual(otherBefore);
  });

  test("updating an order that does not exist is a 404", async () => {
    const res = await as("admin", "put", "/api/order/999999").send({ order_completed: 1, order_services: [{ service_id: prices["Oil change"].id }] });
    expect(res.status).toBe(404);
  });

  test("bug 5: completed is stored as 2 and shown via the tracking link", async () => {
    const res = await as("mechanic", "put", `/api/order/${orderId}`).send({
      order_completed: 2,
      order_services: [
        { service_id: prices["Brake pad replacement"].id, service_completed: 1 },
        { service_id: prices["Wheel balancing"].id, service_completed: 1 },
      ],
    });
    expect(res.status).toBe(200);
    const tracking = await api().get(`/api/order/hash/${orderHash}`);
    expect(tracking.status).toBe(200);
    expect(tracking.body[0]).toMatchObject({ order_id: orderId, order_completed: 2 });
  });

  test("tracking link: unknown hash 404", async () => {
    const res = await api().get("/api/order/hash/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });

  test("an order without services has no phantom service entry", async () => {
    await db("DELETE FROM order_services WHERE order_id = ?", [orderId]);
    const res = await as("admin", "get", `/api/order/${orderId}`);
    expect(res.body[0].order_services).toEqual([]);
    const list = await as("admin", "get", "/api/orders");
    expect(list.body.data.find((o) => o.order_id === orderId).order_services).toEqual([]);
  });
});
