// Login rate limiting (10 failed attempts per IP per 15 min in production).
// Loads a separate copy of the app with a limit of 3 so the test is quick and
// does not throttle the other test files.
const request = require("supertest");

let app;
let db;

beforeAll(() => {
  process.env.LOGIN_RATE_LIMIT_MAX = "3";
  jest.isolateModules(() => {
    app = require("../app");
    db = require("../config/db.config");
  });
});
afterAll(async () => {
  process.env.LOGIN_RATE_LIMIT_MAX = "1000";
  await db.pool.end();
});

const attempt = (password) =>
  request(app).post("/api/employee/login").send({ employee_email: "admin@garagehub.test", employee_password: password });

test("the 4th failed login from one IP is a 429, even with the right password", async () => {
  for (let i = 0; i < 3; i++) expect((await attempt("wrong-password")).status).toBe(401);
  const blocked = await attempt("wrong-password");
  expect(blocked.status).toBe(429);
  expect(blocked.body).toEqual({
    status: "error",
    code: "RATE_LIMITED",
    message: "Too many failed login attempts. Try again later.",
  });
  expect(blocked.headers.ratelimit).toBeDefined();
  expect((await attempt("GarageHub-demo-1")).status).toBe(429);
});
