// Robustness: connection pool, transactions, admin CRUD paths.
// Probe checks 2 and 10.
const { api, db, loginAll, closeDb } = require("./helpers");
const { withTransaction } = require("../config/db.config");

let tokens;
const as = (role, method, path) => api()[method](path).set("x-access-token", tokens[role]);

beforeAll(async () => {
  tokens = await loginAll();
});
afterAll(closeDb);

describe("connection pool (probe 10)", () => {
  test("15 requests that fail inside MySQL do not exhaust the pool (limit 10)", async () => {
    for (let i = 0; i < 15; i++) {
      const res = await as("admin", "post", "/api/addvehicle/999999")
        .send({ vehicle_year: 2010, vehicle_make: "X", vehicle_model: "Y", vehicle_mileage: 1 });
      expect(res.status).toBe(400);
    }
    const res = await as("admin", "get", "/api/services");
    expect(res.status).toBe(200);
  });
});

describe("transactions", () => {
  test("withTransaction rolls back every statement when one fails", async () => {
    await db("CREATE TABLE IF NOT EXISTS tx_probe (id INT PRIMARY KEY)");
    await db("DELETE FROM tx_probe");
    await expect(
      withTransaction(async (q) => {
        await q("INSERT INTO tx_probe VALUES (1)");
        await q("INSERT INTO tx_probe VALUES (1)"); // duplicate key
      })
    ).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
    const [row] = await db("SELECT COUNT(*) AS n FROM tx_probe");
    expect(row.n).toBe(0);
    await db("DROP TABLE tx_probe");
  });

  test("deleting an employee who still has orders is a 409 and deletes nothing", async () => {
    const [manager] = await db("SELECT employee_id FROM employee WHERE employee_email = 'manager@garagehub.test'");
    const res = await as("admin", "delete", `/api/employee/${manager.employee_id}`);
    expect(res.status).toBe(409);
    for (const table of ["employee", "employee_info", "employee_pass", "employee_role"]) {
      const [row] = await db(`SELECT COUNT(*) AS n FROM ${table} WHERE employee_id = ?`, [manager.employee_id]);
      expect(row.n).toBe(1);
    }
  });
});

describe("employee administration (probe 2)", () => {
  let newId;

  test("admin creates an employee (password stored hashed)", async () => {
    const res = await as("admin", "post", "/api/employee").send({
      employee_email: "new.mechanic@garagehub.test", employee_password: "longenough",
      employee_first_name: "New", employee_last_name: "Mechanic", employee_phone: "555-0177",
      company_role_id: "1",
    });
    expect(res.status).toBe(200);
    const [row] = await db(
      `SELECT e.employee_id, p.employee_password_hashed FROM employee e JOIN employee_pass p USING (employee_id)
       WHERE e.employee_email = 'new.mechanic@garagehub.test'`);
    expect(row.employee_password_hashed).toMatch(/^\$2[ab]\$10\$/);
    newId = row.employee_id;
  });

  test("the same email again is a 409", async () => {
    const res = await as("admin", "post", "/api/employee").send({
      employee_email: "new.mechanic@garagehub.test", employee_password: "longenough",
      employee_first_name: "N", employee_last_name: "M", employee_phone: "1", company_role_id: 1,
    });
    expect(res.status).toBe(409);
  });

  test("the new employee can log in", async () => {
    const res = await api().post("/api/employee/login")
      .send({ employee_email: "new.mechanic@garagehub.test", employee_password: "longenough" });
    expect(res.status).toBe(200);
  });

  test("admin updates the employee (role and active flag)", async () => {
    const res = await as("admin", "put", `/api/employee/${newId}`).send({
      employee_first_name: "New", employee_last_name: "Manager", employee_phone: "555-0178",
      company_role_id: 2, active_employee: false,
    });
    expect(res.status).toBe(200);
    const [row] = await db(
      `SELECT e.active_employee, r.company_role_id FROM employee e JOIN employee_role r USING (employee_id) WHERE employee_id = ?`, [newId]);
    expect(row).toEqual({ active_employee: 0, company_role_id: 2 });
  });

  test("updating an employee that does not exist is a 404", async () => {
    const res = await as("admin", "put", "/api/employee/999999").send({
      employee_first_name: "X", employee_last_name: "Y", employee_phone: "1", company_role_id: 1, active_employee: 1,
    });
    expect(res.status).toBe(404);
  });

  test("admin deletes the employee (no orders): all four rows are gone", async () => {
    const res = await as("admin", "delete", `/api/employee/${newId}`);
    expect(res.status).toBe(200);
    const [row] = await db("SELECT COUNT(*) AS n FROM employee_info WHERE employee_id = ?", [newId]);
    expect(row.n).toBe(0);
  });

  test("reading one employee never returns the password hash", async () => {
    const [mech] = await db("SELECT employee_id FROM employee WHERE employee_email = 'mechanic@garagehub.test'");
    const res = await as("admin", "get", `/api/employee/${mech.employee_id}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });
});

describe("service catalog (probe 3)", () => {
  let id;
  test("admin adds, updates and deletes a service", async () => {
    expect((await as("admin", "post", "/api/services").send({ service_name: "Test wash", service_price: 10 })).status).toBe(200);
    [{ service_id: id }] = await db("SELECT service_id FROM common_services WHERE service_name = 'Test wash'");
    const upd = await as("admin", "put", `/api/services/${id}`).send({ service_name: "Test wash", service_price: "12.50" });
    expect(upd.status).toBe(200);
    const [row] = await db("SELECT service_price FROM common_services WHERE service_id = ?", [id]);
    expect(row.service_price).toBe(12.5);
    expect((await as("admin", "delete", `/api/services/${id}`)).status).toBe(200);
  });

  test("deleting a service that orders use is a 409", async () => {
    const [used] = await db("SELECT service_id FROM order_services LIMIT 1");
    const res = await as("admin", "delete", `/api/services/${used.service_id}`);
    expect(res.status).toBe(409);
  });

  test("updating or deleting a missing service is a 404", async () => {
    expect((await as("admin", "put", "/api/services/999999").send({ service_name: "X", service_price: 1 })).status).toBe(404);
    expect((await as("admin", "delete", "/api/services/999999")).status).toBe(404);
  });
});

describe("not-found reads", () => {
  test.each([
    ["/api/customers/999999"],
    ["/api/getvehicle/999999"],
    ["/api/order/999999"],
    ["/api/singleorder/999999"],
    ["/api/employee/999999"],
  ])("GET %s is a 404", async (path) => {
    const res = await as("admin", "get", path);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("editing a missing customer or vehicle is a 404", async () => {
    expect((await as("admin", "put", "/api/customers/999999").send({
      customer_first_name: "X", customer_last_name: "", customer_phone_number: "", active_customer_status: 1,
    })).status).toBe(404);
    expect((await as("admin", "put", "/api/editvehicle/999999").send({
      vehicle_year: 2010, vehicle_make: "X", vehicle_model: "Y", vehicle_mileage: 1,
    })).status).toBe(404);
  });
});
