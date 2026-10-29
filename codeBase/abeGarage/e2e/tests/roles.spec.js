// Bug 4: every role saw every menu item and dashboard card.
// Walkthrough rows 18-38: what each role may and may not do in the UI, Demo's
// read-only enforcement (UI and API), and the tampered-token logout.
const { test, expect } = require("@playwright/test");
const { apiAs, loginAs, loginUI, createCustomerWithVehicle } = require("./helpers");

const MENUS = {
  admin: ["Dashboard", "Orders", "New order", "Add employee", "Employees", "Add customer", "Customers", "Services"],
  manager: ["Dashboard", "Orders", "New order", "Employees", "Add customer", "Customers", "Services"],
  mechanic: ["Dashboard", "Orders", "Customers", "Services"],
  demo: ["Dashboard", "Orders", "Employees", "Customers", "Services"],
};
const SERVICE_CARD = { admin: "Add Services", manager: "Services", mechanic: "Services", demo: "Services" };

for (const [role, menu] of Object.entries(MENUS)) {
  test(`bug 4: ${role} sees only their menu items and cards`, async ({ page }) => {
    await loginUI(page, role);
    await page.goto("/admin");
    await expect(page.locator(".list-group a")).toHaveText(menu);
    const cardLinks = await page.locator(".service-block-one a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const href of cardLinks) {
      const allowed = { "/admin/orderS": "Orders", "/admin/new-order": "New order", "/admin/employee": "Employees",
        "/admin/add-employee": "Add employee", "/admin/add_customers": "Add customer",
        "/admin/all_customers": "Customers", "/admin/service": "Services" }[href];
      expect(menu, `card ${href}`).toContain(allowed);
    }
    await expect(page.locator(".service-block-one:has(a[href='/admin/service']) h2")).toHaveText(SERVICE_CARD[role]);
  });
}

const FORBIDDEN_PAGES = {
  manager: ["/admin/add-employee"],
  mechanic: ["/admin/add_customers", "/admin/employee", "/admin/new-order"],
  demo: ["/admin/add_customers", "/admin/new-order", "/admin/add-employee"],
};
for (const [role, paths] of Object.entries(FORBIDDEN_PAGES)) {
  test(`${role} is sent to /unauthorized from pages they can't use`, async ({ page, request }) => {
    await loginAs(page, request, role);
    for (const path of paths) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/unauthorized$/);
    }
  });
}

test("Manager: deleting a service shows the API's 403 as an error dialog", async ({ page, request }) => {
  await loginAs(page, request, "manager");
  await page.goto("/admin/service");
  const del = page.waitForResponse((r) => r.request().method() === "DELETE" && r.url().includes("/api/services/"));
  await page.locator("li:has-text('Suspension inspection') svg").nth(1).click();
  expect((await del).status()).toBe(403);
  await expect(page.locator(".swal2-popup")).toContainText("You do not have permission to perform this action");
  await expect(page.locator("li:has-text('Suspension inspection')")).toBeVisible();
});

test("Manager: editing a customer's phone is saved", async ({ page, request }) => {
  const { customerId } = await createCustomerWithVehicle(request, "Edit");
  const token = await loginAs(page, request, "manager");
  await page.goto(`/admin/customer_edit/${customerId}`);
  await page.fill("input[name=customer_phone]", "555-0143");
  const save = page.waitForResponse((r) => r.request().method() === "PUT" && r.url().includes(`/api/customers/${customerId}`));
  await page.click("button:has-text('Update')");
  expect((await save).status()).toBe(200);
  const { data } = await (await apiAs(request, token).get(`/customers/${customerId}`)).json();
  expect(data[0].customer_phone_number).toBe("555-0143");
});

test("Demo: deleting an employee is blocked with a clear message and no request", async ({ page, request }) => {
  const deletes = [];
  page.on("request", (r) => r.method() === "DELETE" && deletes.push(r.url()));
  await loginAs(page, request, "demo");
  await page.goto("/admin/employee");
  await page.locator("tbody tr:has-text('mechanic@garagehub.test') svg").nth(1).click();
  await expect(page.locator(".swal2-popup")).toContainText("The demo account cannot delete employees.");
  expect(deletes).toEqual([]);
});

test("Demo: deleting a service is blocked with a clear message and no request", async ({ page, request }) => {
  const deletes = [];
  page.on("request", (r) => r.method() === "DELETE" && deletes.push(r.url()));
  await loginAs(page, request, "demo");
  await page.goto("/admin/service");
  await page.locator("li:has-text('Oil change') svg").nth(1).click();
  await expect(page.locator(".swal2-popup")).toContainText("The demo account cannot delete Services.");
  expect(deletes).toEqual([]);
});

test("Demo: writes sent straight to the API are refused (403)", async ({ page, request }) => {
  const { customerId } = await createCustomerWithVehicle(request, "Demo");
  const demo = apiAs(request, await loginAs(page, request, "demo"));
  const statuses = [
    (await demo.post("/customers", { customer_email: "x@example.com", customer_first_name: "X" })).status(),
    (await demo.put(`/customers/${customerId}`, { customer_first_name: "H", customer_last_name: "", customer_phone_number: "", active_customer_status: 1 })).status(),
    (await demo.post(`/addvehicle/${customerId}`, { vehicle_year: 2020, vehicle_make: "X", vehicle_model: "Y", vehicle_mileage: 1 })).status(),
    (await demo.delete("/services/1")).status(),
    (await demo.delete("/employee/1")).status(),
  ];
  expect(statuses).toEqual([403, 403, 403, 403, 403]);
});

test("a tampered token is cleared and the user is sent to /login", async ({ page, request }) => {
  await loginAs(page, request, "demo");
  await page.evaluate(() => {
    const [h, p] = JSON.parse(localStorage.getItem("Our-token")).split(".");
    localStorage.setItem("Our-token", JSON.stringify(`${h}.${p}.tampered-signature`));
  });
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("Our-token"))).toBeNull();
});
