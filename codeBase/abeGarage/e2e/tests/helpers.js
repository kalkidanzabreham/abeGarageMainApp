// Shared helpers for the browser tests.
const { expect } = require("@playwright/test");

const API = process.env.E2E_API_URL || "http://localhost:5000/api";
// Same variables the seed uses (SEED_<ROLE>_PASSWORD); locally they are
// usually unset and the seed's local default applies.
const LOCAL_DEFAULT = "GarageHub-demo-1";
const passwordFor = (role) => process.env[`SEED_${role.toUpperCase()}_PASSWORD`] || LOCAL_DEFAULT;
const PASSWORD = passwordFor("admin");

const apiLogin = async (request, role) => {
  const res = await request.post(`${API}/employee/login`, {
    data: { employee_email: `${role}@garagehub.test`, employee_password: passwordFor(role) },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).token;
};

const apiAs = (request, token) => ({
  get: (path) => request.get(`${API}${path}`, { headers: { "x-access-token": token } }),
  post: (path, data) => request.post(`${API}${path}`, { data, headers: { "x-access-token": token } }),
  put: (path, data) => request.put(`${API}${path}`, { data, headers: { "x-access-token": token } }),
  delete: (path) => request.delete(`${API}${path}`, { headers: { "x-access-token": token } }),
});

// Log in through the real form.
const loginUI = async (page, role) => {
  await page.goto("/login");
  await page.fill("input[name=employee_email]", `${role}@garagehub.test`);
  await page.fill("input[name=employee_password]", passwordFor(role));
  await page.click("button:has-text('Login')");
  await page.waitForURL(/\/admin/);
};

// Faster login for tests that are not about the login form: store a real
// token the same way the login form does.
const loginAs = async (page, request, role) => {
  const token = await apiLogin(request, role);
  await page.goto("/");
  await page.evaluate((t) => localStorage.setItem("Our-token", JSON.stringify(t)), token);
  return token;
};

// A customer with one vehicle, created through the API as Admin.
const createCustomerWithVehicle = async (request, label) => {
  const admin = apiAs(request, await apiLogin(request, "admin"));
  const email = `${label}.${Date.now()}@example.com`;
  const c = await admin.post("/customers", {
    customer_email: email, customer_first_name: label, customer_last_name: "E2E", customer_phone_number: "555-0190",
  });
  expect(c.status()).toBe(201);
  const customerId = (await c.json()).customer.customer_id;
  const v = await admin.post(`/addvehicle/${customerId}`, {
    vehicle_year: 2019, vehicle_make: "Mazda", vehicle_model: "CX-5", vehicle_mileage: 61000,
    vehicle_tag: `E2E-${customerId}`, vehicle_type: "SUV", vehicle_serial: "S", vehicle_color: "Blue",
  });
  expect(v.status()).toBe(201);
  return { email, customerId, vehicleId: (await v.json()).vehicle_id, tag: `E2E-${customerId}` };
};

const servicePrices = async (request) => {
  const admin = apiAs(request, await apiLogin(request, "admin"));
  const { data } = await (await admin.get("/services")).json();
  return Object.fromEntries(data.map((s) => [s.service_name, { id: s.service_id, price: s.service_price }]));
};

// Uncaught exceptions in the page (the blank-page class of bugs).
const collectPageErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};

module.exports = { API, PASSWORD, passwordFor, apiLogin, apiAs, loginUI, loginAs, createCustomerWithVehicle, servicePrices, collectPageErrors };
