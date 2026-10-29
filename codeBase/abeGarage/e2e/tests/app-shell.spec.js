// Bug A: the app rendered a blank page (React plugin missing from vite config).
// Bug 9: reloading a nested route in a production build loaded
//        /admin/assets/... (relative base path), got 404 and rendered nothing.
const { test, expect } = require("@playwright/test");
const { loginAs, collectPageErrors } = require("./helpers");

test("bug A: the home page renders without uncaught errors", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.locator("#root > *")).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("bug 9: reloading a deep link loads assets from /assets and renders", async ({ page, request }) => {
  await loginAs(page, request, "admin");
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  const assetResponses = [];
  page.on("response", (r) => {
    if (r.url().includes("/assets/")) assetResponses.push({ url: new URL(r.url()).pathname, status: r.status() });
  });
  await page.reload();
  await expect(page.locator("tbody tr").first()).toBeVisible();

  expect(assetResponses.length).toBeGreaterThan(0);
  for (const a of assetResponses) {
    expect(a.url.startsWith("/assets/"), a.url).toBe(true);
    expect([200, 304]).toContain(a.status);
  }
});
