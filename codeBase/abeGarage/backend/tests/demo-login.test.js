// POST /api/employee/demo-login: one-click login to the read-only Demo account.
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { api, db, closeDb } = require("./helpers");
const { ROLES } = require("../config/roles");

afterAll(closeDb);

const isolatedApp = (env) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  let app;
  let pool;
  jest.isolateModules(() => {
    app = require("../app");
    pool = require("../config/db.config").pool;
  });
  process.env = saved;
  return { app, close: () => pool.end() };
};

test("signs in as the Demo role with a short-lived token", async () => {
  const res = await api().post("/api/employee/demo-login");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ status: "success" });
  const payload = jwt.decode(res.body.token);
  expect(payload.employee_role_id).toBe(ROLES.DEMO);
  expect(payload.exp - payload.iat).toBe(2 * 60 * 60); // DEMO_TOKEN_EXPIRES_IN default 2h
});

test("the demo token can read but every write is refused", async () => {
  const { token } = (await api().post("/api/employee/demo-login")).body;
  expect((await api().get("/api/orders").set("x-access-token", token)).status).toBe(200);
  const write = await api()
    .post("/api/customers")
    .set("x-access-token", token)
    .send({ customer_email: `demo-write-${Date.now()}@example.com`, customer_first_name: "No" });
  expect(write.status).toBe(403);
});

test("no active Demo account: 404 DEMO_UNAVAILABLE (and no token)", async () => {
  await db("UPDATE employee SET active_employee = 0 WHERE employee_email = 'demo@garagehub.test'");
  try {
    const res = await api().post("/api/employee/demo-login");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "DEMO_UNAVAILABLE" });
    expect(res.body.token).toBeUndefined();
  } finally {
    await db("UPDATE employee SET active_employee = 1 WHERE employee_email = 'demo@garagehub.test'");
  }
});

test("DEMO_LOGIN_ENABLED=false: the route doesn't exist and isn't documented", async () => {
  const { app, close } = isolatedApp({ DEMO_LOGIN_ENABLED: "false" });
  try {
    // with the route gone, the request falls through to the authenticated
    // API like any unknown path: no token is ever issued
    const res = await request(app).post("/api/employee/demo-login");
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
    const docs = await request(app).get("/api/openapi.json");
    expect(docs.body.paths["/api/employee/demo-login"]).toBeUndefined();
  } finally {
    await close();
  }
});

test("rate-limited per IP", async () => {
  const { app, close } = isolatedApp({ DEMO_LOGIN_RATE_LIMIT: "2" });
  try {
    expect((await request(app).post("/api/employee/demo-login")).status).toBe(200);
    expect((await request(app).post("/api/employee/demo-login")).status).toBe(200);
    const limited = await request(app).post("/api/employee/demo-login");
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe("RATE_LIMITED");
  } finally {
    await close();
  }
});
