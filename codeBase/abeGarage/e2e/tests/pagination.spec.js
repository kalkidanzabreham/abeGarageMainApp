// The list pages page through server results (customers, orders, employees)
// and search / filter on the server.
const { test, expect } = require("@playwright/test");
const { apiLogin, apiAs, loginAs } = require("./helpers");

test("customers: the pager moves through server pages and search finds one customer", async ({ page, request }) => {
  const admin = apiAs(request, await apiLogin(request, "admin"));
  const stamp = Date.now();
  for (let i = 0; i < 12; i++) {
    const res = await admin.post("/customers", {
      customer_email: `pager.${stamp}.${i}@example.com`, customer_first_name: "Pager", customer_last_name: `N${i}`,
    });
    expect(res.status()).toBe(201);
  }
  const { pagination } = await (await admin.get("/customers?page_size=10")).json();
  expect(pagination.total_pages).toBeGreaterThan(1);

  const pageRequests = [];
  page.on("request", (r) => r.url().includes("/api/customers?") && pageRequests.push(new URL(r.url()).search));
  await loginAs(page, request, "admin");
  await page.goto("/admin/all_customers");
  await expect(page.getByText(`Page 1 of ${pagination.total_pages}`)).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(10);

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(`Page 2 of ${pagination.total_pages}`)).toBeVisible();
  expect(pageRequests.some((q) => q.includes("page=2"))).toBe(true);

  await page.fill("input[aria-label=Search]", `pager.${stamp}.7@`);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText(`pager.${stamp}.7@example.com`);
  await expect(page.getByText("Page 1 of 1")).toBeVisible();
});

test("orders: the status filter asks the server for one status", async ({ page, request }) => {
  await loginAs(page, request, "admin");
  await page.goto("/admin/orders");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  const filtered = page.waitForResponse((r) => r.url().includes("/api/orders?") && r.url().includes("status=2"));
  await page.selectOption("select[aria-label='Filter by status']", "2");
  await filtered;
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain("Completed");
});

test("employees: the list has a pager (no hard-coded 10-row limit)", async ({ page, request }) => {
  await loginAs(page, request, "admin");
  await page.goto("/admin/employee");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
});
