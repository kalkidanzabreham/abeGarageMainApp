// Walkthrough rows 3-5: logged-out redirect, generic login error, return to
// the requested page after logging in.
const { test, expect } = require("@playwright/test");
const { PASSWORD } = require("./helpers");

test("a staff page redirects to /login when logged out", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByText(/guest/i)).toHaveCount(0); // guest login removed
});

test("a wrong password shows the generic message", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=employee_email]", "admin@garagehub.test");
  await page.fill("input[name=employee_password]", "wrong-password");
  await page.click("button:has-text('Login')");
  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("after logging in, the user lands on the page they asked for", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login$/);
  await page.fill("input[name=employee_email]", "admin@garagehub.test");
  await page.fill("input[name=employee_password]", PASSWORD);
  await page.click("button:has-text('Login')");
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.getByText("Welcome : Ada")).toBeVisible();
});

test("a slow login (sleeping free-tier API) shows the wake-up message, then logs in", async ({ page }) => {
  // hold the login request for 6 s, as a cold-starting server would
  await page.route("**/api/employee/login", async (route) => {
    await new Promise((r) => setTimeout(r, 6000));
    await route.continue();
  });
  await page.goto("/login");
  await page.fill("input[name=employee_email]", "admin@garagehub.test");
  await page.fill("input[name=employee_password]", PASSWORD);
  await page.click("button:has-text('Login')");
  await expect(page.getByRole("button", { name: "Login" })).toBeDisabled();
  await expect(page.getByText("Waking up the demo server, this can take up to a minute")).toBeVisible({ timeout: 7000 });
  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
});

test("a fast login does not show the wake-up message", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=employee_email]", "admin@garagehub.test");
  await page.fill("input[name=employee_password]", PASSWORD);
  await page.click("button:has-text('Login')");
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText("Waking up the demo server")).toHaveCount(0);
});
