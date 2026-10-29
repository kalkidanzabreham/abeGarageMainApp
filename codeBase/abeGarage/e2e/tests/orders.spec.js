// One order followed through the UI:
//  bug 6: New Order showed "Active Customer: No" and edit links to /undefined
//  bug 3: no screen showed the order total
//  bug 2: the Mechanic's order list was stuck on "Loading..." (403 per row)
//  bug 5: "completed" was stored as 3, which the tracking page could not show
const { test, expect } = require("@playwright/test");
const { apiLogin, apiAs, loginAs, createCustomerWithVehicle, servicePrices } = require("./helpers");

const money = (n) => `$${n.toFixed(2)}`;

test.describe.configure({ mode: "serial" });

let customer;
let prices;
let orderId;
let orderHash;

test.beforeAll(async ({ request }) => {
  customer = await createCustomerWithVehicle(request, "Orders");
  prices = await servicePrices(request);
});

test("bugs 6 and 3: New Order shows correct customer details and a live total", async ({ page, request }) => {
  await loginAs(page, request, "admin");
  await page.goto("/admin/new-order");
  await page.fill("input[name=search_customer]", customer.email);
  await page.locator(`table tr:has-text("${customer.email}") svg`).click();

  await expect(page.locator("div:has(> strong:text-is('Active Customer:'))")).toContainText("Yes");
  await expect(page.locator("div:has(> strong:text-is('Edit Customer:')) a")).toHaveAttribute("href", `/admin/customer_edit/${customer.customerId}`);

  await page.locator(`table tr:has-text("${customer.tag}") svg`).click();
  await expect(page.locator("div:has(> strong:text-is('Edit vehicle info:')) a")).toHaveAttribute("href", `/admin/edit_vehicle/${customer.vehicleId}`);

  await page.locator(".service-item:has-text('Oil change') input[type=checkbox]").check();
  await page.locator(".service-item:has-text('Brake pad replacement') input[type=checkbox]").check();
  const expected = prices["Oil change"].price + prices["Brake pad replacement"].price;
  await expect(page.getByTestId("estimated-total")).toHaveText(money(expected));

  await page.click("button:has-text('Submit Order')");
  await expect(page).toHaveURL(/\/admin\/orders$/);

  const admin = apiAs(request, await apiLogin(request, "admin"));
  const { data } = await (await admin.get("/orders")).json();
  const created = data.find((o) => o.customer_id === customer.customerId);
  orderId = created.order_id;
  orderHash = created.order_hash;
  expect(created.order_total_price).toBeCloseTo(expected, 2);
});

test("bug 3: the total is shown on the list, the order view, the edit page and the tracking link", async ({ page, request }) => {
  const expected = money(prices["Oil change"].price + prices["Brake pad replacement"].price);
  await loginAs(page, request, "admin");

  await page.goto("/admin/orders");
  await expect(page.locator(`tbody tr:has(td:text-is("${orderId}"))`)).toContainText(expected);

  await page.goto(`/admin/orders/${orderId}`);
  await expect(page.getByTestId("order-total")).toHaveText(expected);
  await expect(page.locator(".rounded.shadow-sm:has-text('Oil change')")).toContainText(money(prices["Oil change"].price));

  await page.goto(`/admin/edit-order/${orderId}`);
  await expect(page.getByTestId("estimated-total")).toHaveText(expected);

  await page.goto(`/customer_order/${orderHash}`);
  await expect(page.getByTestId("order-total")).toHaveText(expected);
});

test("bug 2: the Mechanic's order list shows creator names without employee lookups", async ({ page, request }) => {
  const employeeCalls = [];
  page.on("request", (r) => r.url().includes("/api/employee") && employeeCalls.push(r.url()));
  await loginAs(page, request, "mechanic");
  await page.goto("/admin/orders");
  const row = page.locator(`tbody tr:has(td:text-is("${orderId}"))`);
  await expect(row).toContainText("Ada Admin");
  await expect(page.getByText("Loading...")).toHaveCount(0);
  expect(employeeCalls).toEqual([]);
});

test("bug 5: when the Mechanic completes every service the order is stored as 2 and shows Completed", async ({ page, request }) => {
  await loginAs(page, request, "mechanic");
  await page.goto(`/admin/edit-order/${orderId}`);
  await page.check("#orderCompleted");
  await page.selectOption(".service-item:has-text('Oil change') select", "1");
  await page.selectOption(".service-item:has-text('Brake pad replacement') select", "1");
  await page.click("button:has-text('Update Order')");
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.locator(`tbody tr:has(td:text-is("${orderId}"))`)).toContainText("Completed");

  const tracking = await (await request.get(`${require("./helpers").API}/order/hash/${orderHash}`)).json();
  expect(tracking[0].order_completed).toBe(2);

  await page.goto(`/customer_order/${orderHash}`);
  await expect(page.locator(".status-badge").first()).toHaveText("Completed");
});
