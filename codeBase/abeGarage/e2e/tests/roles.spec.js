// Bug 4: every role saw every menu item and dashboard card.
// Walkthrough rows 18-38: what each role may and may not do in the UI, Demo's
// read-only enforcement (UI and API), and the tampered-token logout.
const { test, expect } = require("@playwright/test");
const { apiAs, apiLogin, loginAs, loginUI, createCustomerWithVehicle } = require("./helpers");

// sidebar order: Workshop (Dashboard, Orders, New order, Smart intake),
// People (Customers, Add customer, Employees, Add employee), Catalog
const MENUS = {
  admin: ["Dashboard", "Orders", "New order", "Customers", "Add customer", "Employees", "Add employee", "Services"],
  manager: ["Dashboard", "Orders", "New order", "Customers", "Add customer", "Employees", "Services"],
  mechanic: ["Dashboard", "Orders", "Customers", "Services"],
  demo: ["Dashboard", "Orders", "Customers", "Employees", "Services"],
};
const PATHS = { Dashboard: "/admin", Orders: "/admin/orders", "New order": "/admin/new-order", "Smart intake (AI)": "/admin/smart-intake",
  Customers: "/admin/all_customers", "Add customer": "/admin/add_customers", Employees: "/admin/employee",
  "Add employee": "/admin/add-employee", Services: "/admin/service" };
const SERVICE_CARD = { admin: "Manage services", manager: "Services", mechanic: "Services", demo: "Services" };

for (const [role, menu] of Object.entries(MENUS)) {
  test(`bug 4: ${role} sees only their menu items and cards`, async ({ page, request }) => {
    // the smart intake item exists only when the API has the feature on for this role
    const aiStatus = await apiAs(request, await apiLogin(request, role)).get("/ai/status");
    const expected = [...menu];
    if (aiStatus.ok()) expected.splice(expected.indexOf("Orders") + (menu.includes("New order") ? 2 : 1), 0, "Smart intake (AI)");
    await loginUI(page, role);
    await page.goto("/admin");
    await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link")).toHaveText(expected);
    // every dashboard quick action leads to a page this role may open
    const actions = page.getByRole("region", { name: "Quick actions" }).getByRole("link");
    await expect(actions.first()).toBeVisible();
    const allowedPaths = expected.map((label) => PATHS[label]);
    for (const href of await actions.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      expect(allowedPaths, `quick action ${href}`).toContain(href);
    }
    await expect(page.getByRole("region", { name: "Quick actions" }).locator('a[href="/admin/service"] strong')).toHaveText(SERVICE_CARD[role]);
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

test("Manager: the service catalog is read-only (no edit or delete controls)", async ({ page, request }) => {
  await loginAs(page, request, "manager");
  await page.goto("/admin/service");
  await expect(page.locator("li:has-text('Suspension inspection')")).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete Suspension inspection/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Add a new service" })).toHaveCount(0);
});

// Walkthrough bug: API errors on the services page were silently ignored.
// The API is made to refuse the delete, as it would for a missing permission.
test("an API error while deleting a service is shown as a dialog, and the service stays", async ({ page, request }) => {
  await loginAs(page, request, "admin");
  await page.route("**/api/services/*", (route) =>
    route.request().method() === "DELETE"
      ? route.fulfill({ status: 403, json: { status: "error", code: "FORBIDDEN", message: "You do not have permission to perform this action" } })
      : route.continue()
  );
  await page.goto("/admin/service");
  await page.getByRole("button", { name: "Delete Suspension inspection" }).click();
  await page.locator(".swal2-confirm").click();
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
