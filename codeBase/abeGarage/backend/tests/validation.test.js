// Request validation and the error shape. Probe check 8 (no SQL in errors).
const { api, login, sampleIds, closeDb } = require("./helpers");

let admin;
let ids;

beforeAll(async () => {
  admin = await login("admin");
  ids = await sampleIds();
});
afterAll(closeDb);

const asAdmin = (method, path) => api()[method](path).set("x-access-token", admin);

const expectValidationError = (res, location, path) => {
  expect(res.status).toBe(400);
  expect(res.body).toMatchObject({ status: "error", code: "VALIDATION_ERROR", message: "Invalid request" });
  expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ location, path })]));
};

describe("params", () => {
  test("non-numeric id", async () => {
    expectValidationError(await asAdmin("get", "/api/customers/abc"), "params", "id");
  });
  test("zero / negative id", async () => {
    expectValidationError(await asAdmin("get", "/api/order/0"), "params", "id");
    expectValidationError(await asAdmin("get", "/api/order/-5"), "params", "id");
  });
  test("tracking hash must look like a UUID", async () => {
    const res = await api().get("/api/order/hash/not-a-hash");
    expectValidationError(res, "params", "hash");
  });
});

describe("query strings", () => {
  test("unknown query parameters are rejected", async () => {
    const res = await asAdmin("get", "/api/customers?debug=1");
    expect(res.status).toBe(400);
    expect(res.body.details[0].location).toBe("query");
  });
});

describe("bodies", () => {
  test("customer: invalid email and missing first name are both reported", async () => {
    const res = await asAdmin("post", "/api/customers").send({ customer_email: "not-an-email" });
    expectValidationError(res, "body", "customer_email");
    expect(res.body.details.map((d) => d.path)).toContain("customer_first_name");
  });

  test("employee: password shorter than 8 characters", async () => {
    const res = await asAdmin("post", "/api/employee").send({
      employee_email: "short@garagehub.test", employee_password: "1234567",
      employee_first_name: "S", employee_last_name: "P", employee_phone: "1", company_role_id: 1,
    });
    expectValidationError(res, "body", "employee_password");
  });

  test("employee: unknown role id", async () => {
    const res = await asAdmin("post", "/api/employee").send({
      employee_email: "role@garagehub.test", employee_password: "longenough",
      employee_first_name: "R", employee_last_name: "O", employee_phone: "1", company_role_id: 9,
    });
    expectValidationError(res, "body", "company_role_id");
  });

  test("vehicle: year and mileage ranges", async () => {
    const res = await asAdmin("put", `/api/editvehicle/${ids.vehicleId}`)
      .send({ vehicle_year: 1700, vehicle_make: "X", vehicle_model: "Y", vehicle_mileage: -5 });
    expectValidationError(res, "body", "vehicle_year");
    expect(res.body.details.map((d) => d.path)).toContain("vehicle_mileage");
  });

  test("service: price must be a non-negative amount with at most 2 decimals", async () => {
    expectValidationError(await asAdmin("post", "/api/services").send({ service_name: "X", service_price: -1 }), "body", "service_price");
    expectValidationError(await asAdmin("post", "/api/services").send({ service_name: "X", service_price: 1.234 }), "body", "service_price");
  });

  test("order: at least one service, no duplicates", async () => {
    const empty = await asAdmin("post", "/api/order").send({ customer_id: ids.customerId, vehicle_id: ids.vehicleId, order_services: [] });
    expectValidationError(empty, "body", "order_services");
    const dup = await asAdmin("post", "/api/order").send({
      customer_id: ids.customerId, vehicle_id: ids.vehicleId,
      order_services: [{ service_id: ids.serviceId }, { service_id: ids.serviceId }],
    });
    expectValidationError(dup, "body", "order_services");
  });

  test("order: status 3 is rejected (only 0, 1, 2 exist)", async () => {
    const res = await asAdmin("put", `/api/order/${ids.orderId}`)
      .send({ order_completed: 3, order_services: [{ service_id: ids.serviceId }] });
    expectValidationError(res, "body", "order_completed");
  });
});

describe("error responses (probe 8)", () => {
  test("validation errors never include SQL or stack traces outside development", async () => {
    const res = await asAdmin("post", "/api/order").send({ customer_id: 1 });
    expect(res.status).toBe(400);
    // MySQL messages / codes look like "Column ... cannot be null", "ER_BAD_NULL_ERROR"
    expect(JSON.stringify(res.body)).not.toMatch(/cannot be null|SQL|ER_[A-Z]/);
    expect(res.body.stack).toBeUndefined();
  });

  test("database constraint errors are mapped to safe messages", async () => {
    // vehicle for a customer that does not exist -> FK violation inside MySQL
    const res = await asAdmin("post", "/api/addvehicle/999999")
      .send({ vehicle_year: 2010, vehicle_make: "X", vehicle_model: "Y", vehicle_mileage: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: "error", code: "BAD_REFERENCE", message: "A referenced record does not exist" });
  });

  test("unknown routes return the JSON 404 shape", async () => {
    const res = await asAdmin("get", "/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: "error", code: "NOT_FOUND", message: "Route GET /api/nope not found" });
  });
});
