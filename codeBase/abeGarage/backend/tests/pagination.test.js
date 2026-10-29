// Pagination and filters on the list endpoints.
const { api, db, login, resetDb, closeDb } = require("./helpers");

let admin;
const get = (path) => api().get(path).set("x-access-token", admin);

beforeAll(async () => {
  await resetDb();
  admin = await login("admin");
  // 25 extra customers so customers span several pages
  for (let i = 0; i < 25; i++) {
    await api().post("/api/customers").set("x-access-token", admin).send({
      customer_email: `page.${String(i).padStart(2, "0")}@example.com`,
      customer_first_name: "Page", customer_last_name: `Test${i}`, customer_phone_number: `555-02${String(i).padStart(2, "0")}`,
    });
  }
  // a phone number with SQL wildcard characters in it
  await api().post("/api/customers").set("x-access-token", admin).send({
    customer_email: "wild.card@example.com", customer_first_name: "Wild", customer_last_name: "Card",
    customer_phone_number: "50%_off",
  });
});
afterAll(closeDb);

describe("customers", () => {
  test("defaults: page 1, 20 per page, newest first, correct totals", async () => {
    const [{ n }] = await db("SELECT COUNT(*) AS n FROM customer_identifier");
    const res = await get("/api/customers");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.pagination).toEqual({ page: 1, page_size: 20, total: n, total_pages: Math.ceil(n / 20) });
    const ids = res.body.data.map((c) => c.customer_id);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  test("pages don't overlap and together cover every customer", async () => {
    const [{ n }] = await db("SELECT COUNT(*) AS n FROM customer_identifier");
    const seen = [];
    for (let page = 1; page <= Math.ceil(n / 7); page++) {
      const res = await get(`/api/customers?page=${page}&page_size=7`);
      seen.push(...res.body.data.map((c) => c.customer_id));
    }
    expect(seen).toHaveLength(n);
    expect(new Set(seen).size).toBe(n);
  });

  test("a page past the end is empty, not an error", async () => {
    const res = await get("/api/customers?page=999");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("q searches name, email and phone", async () => {
    expect((await get("/api/customers?q=Test1")).body.pagination.total).toBe(11); // Test1, Test10-19
    expect((await get("/api/customers?q=page.07")).body.data[0].customer_last_name).toBe("Test7");
    expect((await get("/api/customers?q=555-0203")).body.data).toHaveLength(1);
    expect((await get("/api/customers?q=Page%20Test24")).body.data).toHaveLength(1);
  });

  test("% and _ in the search text are literal, not wildcards", async () => {
    const percent = await get("/api/customers?q=" + encodeURIComponent("%"));
    expect(percent.body.data.map((c) => c.customer_email)).toEqual(["wild.card@example.com"]);
    const underscore = await get("/api/customers?q=" + encodeURIComponent("%_"));
    expect(underscore.body.data.map((c) => c.customer_email)).toEqual(["wild.card@example.com"]);
  });

  test("active filter", async () => {
    const [{ n }] = await db("SELECT COUNT(*) AS n FROM customer_info WHERE active_customer_status = 0");
    expect((await get("/api/customers?active=0")).body.pagination.total).toBe(n);
  });

  test("invalid paging values are a 400", async () => {
    for (const q of ["page=0", "page_size=0", "page_size=101", "page=abc", "active=2", "foo=1"]) {
      const res = await get(`/api/customers?${q}`);
      expect({ q, status: res.status }).toEqual({ q, status: 400 });
      expect(res.body.code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("vehicles, orders, employees", () => {
  test("GET /api/vehicles pages over all vehicles and filters by customer", async () => {
    const [{ n }] = await db("SELECT COUNT(*) AS n FROM customer_vehicle_info");
    const all = await get("/api/vehicles?page_size=4");
    expect(all.body.pagination).toEqual({ page: 1, page_size: 4, total: n, total_pages: Math.ceil(n / 4) });
    const [first] = await db("SELECT customer_id FROM customer_vehicle_info ORDER BY vehicle_id LIMIT 1");
    const mine = await get(`/api/vehicles?customer_id=${first.customer_id}`);
    expect(mine.body.data.every((v) => v.customer_id === first.customer_id)).toBe(true);
    expect((await get("/api/vehicles?q=Corolla")).body.data[0].vehicle_model).toBe("Corolla");
  });

  test("orders: status filter, and paging keeps every service of an order together", async () => {
    const statuses = (await get("/api/orders?status=1")).body.data.map((o) => o.order_completed);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((s) => s === 1)).toBe(true);

    const pageOne = await get("/api/orders?page_size=2");
    expect(pageOne.body.data).toHaveLength(2);
    for (const order of pageOne.body.data) {
      const [{ n }] = await db("SELECT COUNT(*) AS n FROM order_services WHERE order_id = ?", [order.order_id]);
      expect(order.order_services).toHaveLength(n);
    }
    const [{ n: total }] = await db("SELECT COUNT(*) AS n FROM orders");
    expect(pageOne.body.pagination.total).toBe(total);
  });

  test("orders: q matches customer name or vehicle tag", async () => {
    const res = await get("/api/orders?q=DEMO-003");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].vehicle_tag).toBe("DEMO-003");
  });

  test("employees: no more hard-coded LIMIT 10, role filter, no password hashes", async () => {
    for (let i = 0; i < 9; i++) {
      await api().post("/api/employee").set("x-access-token", admin).send({
        employee_email: `staff${i}@garagehub.test`, employee_password: "longenough",
        employee_first_name: "Staff", employee_last_name: `${i}`, employee_phone: "1", company_role_id: 1,
      });
    }
    const [{ n }] = await db("SELECT COUNT(*) AS n FROM employee");
    expect(n).toBeGreaterThan(10);
    const all = await get("/api/employee?page_size=100");
    expect(all.body.data).toHaveLength(n);
    const mechanics = await get("/api/employee?role=1");
    expect(mechanics.body.data.every((e) => e.company_role_id === 1)).toBe(true);
    expect(JSON.stringify(all.body)).not.toMatch(/password/i);
  });
});
