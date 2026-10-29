// Login and token handling. Probe checks 6, 7 (guest login), 9 and 11.
const jwt = require("jsonwebtoken");
const { api, db, login, closeDb, PASSWORD } = require("./helpers");

const SECRET = process.env.JWT_SECRET;
const loginAs = (body) => api().post("/api/employee/login").send(body);

afterAll(closeDb);

describe("POST /api/employee/login", () => {
  test("valid credentials return a JWT with the role and employee id", async () => {
    const res = await loginAs({ employee_email: "admin@garagehub.test", employee_password: PASSWORD });
    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, SECRET);
    expect(payload.employee_role_id).toBe(3);
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  test("probe 6: wrong password and unknown email get the same generic 401", async () => {
    const wrongPassword = await loginAs({ employee_email: "admin@garagehub.test", employee_password: "nope" });
    const unknownEmail = await loginAs({ employee_email: "nobody@garagehub.test", employee_password: "nope" });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body).toEqual({
      status: "error",
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  });

  test("probe 6: a deactivated employee cannot log in", async () => {
    await db("UPDATE employee SET active_employee = 0 WHERE employee_email = 'demo@garagehub.test'");
    try {
      const res = await loginAs({ employee_email: "demo@garagehub.test", employee_password: PASSWORD });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCOUNT_DISABLED");
    } finally {
      await db("UPDATE employee SET active_employee = 1 WHERE employee_email = 'demo@garagehub.test'");
    }
  });

  test("probe 11: a missing password is a 400 and the server keeps serving", async () => {
    const res = await loginAs({ employee_email: "admin@garagehub.test" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    const after = await loginAs({ employee_email: "admin@garagehub.test", employee_password: PASSWORD });
    expect(after.status).toBe(200);
  });

  test("probe 9: an object instead of a string is rejected before reaching SQL", async () => {
    const res = await loginAs({ employee_email: { employee_email: 1 }, employee_password: PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.details[0]).toMatchObject({ location: "body", path: "employee_email" });
  });

  test("malformed JSON is a 400 INVALID_JSON", async () => {
    const res = await api()
      .post("/api/employee/login")
      .set("Content-Type", "application/json")
      .send('{"employee_email":');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_JSON");
  });
});

describe("token checks on protected routes", () => {
  test("no token: 401 UNAUTHENTICATED", async () => {
    const res = await api().get("/api/customers");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });

  test("expired token: 401 TOKEN_EXPIRED", async () => {
    const expired = jwt.sign({ employee_role_id: 3, employee_id: 1, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);
    const res = await api().get("/api/customers").set("x-access-token", expired);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });

  test("tampered signature: 401 INVALID_TOKEN", async () => {
    const [header, payload] = (await login("admin")).split(".");
    const res = await api().get("/api/customers").set("x-access-token", `${header}.${payload}.tampered`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  test("token signed with another secret: 401", async () => {
    const forged = jwt.sign({ employee_role_id: 3, employee_id: 1 }, "some-other-secret-of-sufficient-length!!");
    const res = await api().get("/api/customers").set("x-access-token", forged);
    expect(res.status).toBe(401);
  });

  test("'none' algorithm token is rejected (algorithm pinned to HS256)", async () => {
    const unsigned = jwt.sign({ employee_role_id: 3, employee_id: 1 }, null, { algorithm: "none" });
    const res = await api().get("/api/customers").set("x-access-token", unsigned);
    expect(res.status).toBe(401);
  });

  test("probe 7: old guest tokens (role 'guest') are rejected", async () => {
    const guest = jwt.sign({ employee_role_id: "guest", employee_id: "guest_user" }, SECRET);
    const res = await api().get("/api/customers").set("x-access-token", guest);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  test("probe 7: guest login endpoint no longer issues tokens", async () => {
    const res = await api().post("/api/guest-login");
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
