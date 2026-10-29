// Bug 10: the public "Orders" lookup downloaded every order (and all their
// hashes) to check a key; once that list required a login, every valid key
// was reported as wrong.
const { test, expect } = require("@playwright/test");
const { apiLogin, apiAs } = require("./helpers");

const NOT_FOUND = "No order found for that key. Check the link from the garage and try again.";

const lookUp = async (page, key) => {
  await page.goto("/customer_info");
  await page.fill("input[name=customer_info]", key);
  await page.click("button[type=submit]");
};

test("bug 10: a valid key opens the order while logged out, without loading all orders", async ({ page, request }) => {
  const admin = apiAs(request, await apiLogin(request, "admin"));
  const { data } = await (await admin.get("/orders")).json();
  const { order_hash: hash } = data[0];

  const listCalls = [];
  page.on("request", (r) => r.url().endsWith("/api/orders") && listCalls.push(r.url()));
  await lookUp(page, hash);
  await expect(page).toHaveURL(new RegExp(`/customer_order/${hash}$`));
  await expect(page.getByTestId("order-total")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("Our-token"))).toBeNull();
  expect(listCalls).toEqual([]);
});

test("bug 10: an unknown key shows a clear not-found message", async ({ page }) => {
  await lookUp(page, "00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("alert")).toHaveText(NOT_FOUND);
  await expect(page).toHaveURL(/\/customer_info$/);
});

test("bug 10: a malformed key shows the same message", async ({ page }) => {
  await lookUp(page, "not-a-real-key");
  await expect(page.getByRole("alert")).toHaveText(NOT_FOUND);
});
