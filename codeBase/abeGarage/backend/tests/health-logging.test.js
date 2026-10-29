// GET /api/health and the request log format.
const express = require("express");
const request = require("supertest");
const { Writable } = require("node:stream");
const { api, db, login, closeDb, PASSWORD } = require("./helpers");
const { createLogger, createHttpLogger } = require("../utils/logger");

afterAll(closeDb);

describe("GET /api/health", () => {
  test("200 with db ok, no token needed", async () => {
    const res = await api().get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", db: "ok" });
    expect(typeof res.body.db_check_ms).toBe("number");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("503 when the database query fails, without leaking the error", async () => {
    const spy = jest.spyOn(db.pool, "query").mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.0.0.5:3306"));
    try {
      const res = await api().get("/api/health");
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ status: "error", db: "unreachable" });
      expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("request log lines", () => {
  // a tiny app using the real HTTP logger, writing into an array
  const lines = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(...chunk.toString().trim().split("\n").map((l) => JSON.parse(l)));
      cb();
    },
  });
  const app = express();
  app.use(createHttpLogger(createLogger(stream, "info")));
  app.use(express.json());
  app.post("/api/employee/login", (req, res) => res.status(401).json({ status: "error" }));
  app.get("/api/customers", (req, res) => res.json({ data: [] }));

  beforeEach(() => {
    lines.length = 0;
  });

  test("contain request id, method, path, status and duration", async () => {
    const res = await request(app).get("/api/customers").set("X-Request-Id", "trace-123");
    expect(res.headers["x-request-id"]).toBe("trace-123");
    const line = lines.find((l) => l.req);
    expect(line).toMatchObject({
      level: 30, // info
      req: { id: "trace-123", method: "GET", path: "/api/customers" },
      res: { statusCode: 200 },
    });
    expect(typeof line.responseTime).toBe("number");
  });

  test("never contain tokens, passwords, request bodies or query strings", async () => {
    const token = await login("admin");
    await request(app)
      .post("/api/employee/login?search=Liam%20Carter")
      .set("x-access-token", token)
      .send({ employee_email: "admin@garagehub.test", employee_password: PASSWORD });
    const logged = JSON.stringify(lines);
    expect(logged).not.toContain(token);
    expect(logged).not.toContain(PASSWORD);
    expect(logged).not.toContain("employee_password");
    expect(logged).not.toContain("Liam");
    expect(logged).not.toContain("x-access-token");
    const line = lines.find((l) => l.req);
    expect(line.level).toBe(40); // 4xx logged as warn
    expect(line.req.path).toBe("/api/employee/login");
  });

  test("an invalid incoming request id is replaced by a generated one", async () => {
    const res = await request(app).get("/api/customers").set("X-Request-Id", "bad id with spaces <script>");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
