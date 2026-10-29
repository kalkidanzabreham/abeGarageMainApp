// The role matrix, route by route. Expectations are written out here (not
// derived from config/permissions.js), so this tests the agreed spec:
//   Admin: everything. Manager: customers, vehicles, orders; reads employees
//   and services. Mechanic: reads, plus order updates. Demo: GET only.
// Writes are sent with an empty body: an allowed role passes authorization
// and gets a 400 from validation, a denied role gets 403. Nothing changes.
// Probe check 7 (unauthenticated access) is the "no token" column.
const { api, loginAll, sampleIds, closeDb } = require("./helpers");

let tokens;
let ids;

beforeAll(async () => {
  tokens = await loginAll();
  ids = await sampleIds();
});
afterAll(closeDb);

const ALL = ["admin", "manager", "mechanic", "demo"];
const A = ["admin"];
const AM = ["admin", "manager"];

// [method, path (uses ids), roles allowed]
const MATRIX = [
  ["GET", () => "/api/customers", ALL],
  ["GET", (i) => `/api/customers/${i.customerId}`, ALL],
  ["POST", () => "/api/customers", AM],
  ["PUT", (i) => `/api/customers/${i.customerId}`, AM],
  ["GET", (i) => `/api/addvehicle/${i.customerId}`, ALL],
  ["GET", (i) => `/api/getvehicle/${i.vehicleId}`, ALL],
  ["POST", (i) => `/api/addvehicle/${i.customerId}`, AM],
  ["PUT", (i) => `/api/editvehicle/${i.vehicleId}`, AM],
  ["GET", () => "/api/orders", ALL],
  ["GET", (i) => `/api/order/${i.orderId}`, ALL],
  ["GET", (i) => `/api/singleorder/${i.orderId}`, ALL],
  ["GET", (i) => `/api/singleorder_per_customer/${i.customerId}`, ALL],
  ["POST", () => "/api/order", AM],
  ["PUT", (i) => `/api/order/${i.orderId}`, ["admin", "manager", "mechanic"]],
  ["GET", () => "/api/employee", ["admin", "manager", "demo"]],
  ["GET", (i) => `/api/employee/${i.employeeId}`, ["admin", "manager", "demo"]],
  ["POST", () => "/api/employee", A],
  ["PUT", (i) => `/api/employee/${i.employeeId}`, A],
  ["DELETE", () => "/api/employee/999999", A],
  ["GET", () => "/api/services", ALL],
  ["POST", () => "/api/services", A],
  ["PUT", (i) => `/api/services/${i.serviceId}`, A],
  ["DELETE", () => "/api/services/999999", A],
];

const send = (method, path, token) => {
  let req = api()[method.toLowerCase()](path);
  if (token) req = req.set("x-access-token", token);
  return method === "GET" || method === "DELETE" ? req : req.send({});
};

const cases = [];
for (const [method, pathFn, allowed] of MATRIX) {
  const label = pathFn({ customerId: ":customer", vehicleId: ":vehicle", orderId: ":order", serviceId: ":service", employeeId: ":employee" });
  for (const role of ALL) cases.push([method, label, role, allowed.includes(role), pathFn]);
}

describe("role matrix", () => {
  test.each(cases)("%s %s as %s: allowed=%s", async (method, _label, role, allowed, pathFn) => {
    const res = await send(method, pathFn(ids), tokens[role]);
    if (allowed) {
      expect([401, 403]).not.toContain(res.status);
      // reads succeed outright; writes reach validation (400) or a missing id (404)
      if (method === "GET") expect(res.status).toBe(200);
      else expect([400, 404]).toContain(res.status);
    } else {
      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
    }
  });
});

describe("no token (probe 7)", () => {
  test.each(MATRIX.map(([m, p]) => [m, p]))("%s %p returns 401", async (method, pathFn) => {
    const res = await send(method, pathFn(ids));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });
});

describe("Demo is read-only even with a valid body", () => {
  test("a fully valid customer POST is still 403 for Demo", async () => {
    const res = await api()
      .post("/api/customers")
      .set("x-access-token", tokens.demo)
      .send({ customer_email: "demo-write@example.com", customer_first_name: "X" });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("The demo account is read-only");
  });
});

describe("public routes", () => {
  test("the order tracking link works without a token", async () => {
    const res = await api().get(`/api/order/hash/${ids.orderHash}`);
    expect(res.status).toBe(200);
    expect(res.body[0].order_id).toBe(ids.orderId);
  });

  test("probe 1: GET /install no longer exists (401 without token, 404 with one)", async () => {
    expect((await api().get("/install")).status).toBe(401);
    const res = await api().get("/install").set("x-access-token", tokens.admin);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
