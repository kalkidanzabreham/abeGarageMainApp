// Bug 1: the customer profile fetched /api/.../undefined before the customer
// had loaded; the 400 crashed the page and React blanked the whole app.
const { test, expect } = require("@playwright/test");
const { loginAs, createCustomerWithVehicle, collectPageErrors } = require("./helpers");

test("bug 1: the profile renders, never requests /undefined, and adds a vehicle", async ({ page, request }) => {
  const { customerId } = await createCustomerWithVehicle(request, "Profile");
  const errors = collectPageErrors(page);
  const apiUrls = [];
  page.on("request", (r) => r.url().includes("/api/") && apiUrls.push(r.url()));

  await loginAs(page, request, "admin");
  await page.goto(`/admin/customer_profile/${customerId}`);
  await expect(page.getByText(`E2E-${customerId}`)).toBeVisible();

  await page.click("button:has-text('Add Vehicle')");
  await page.fill("input[name=vehicle_year]", "2017");
  await page.fill("input[name=vehicle_make]", "Kia");
  await page.fill("input[name=vehicle_model]", "Rio");
  await page.fill("input[name=vehicle_type]", "Sedan");
  await page.fill("input[name=vehicle_mileage]", "88000");
  await page.fill("input[name=vehicle_tag]", `KIA-${customerId}`);
  await page.fill("input[name=vehicle_serial_number]", "SER-KIA");
  await page.fill("input[name=vehicle_color]", "Red");
  await page.click("form button:has-text('Add Vehicle')");
  await expect(page.getByText(`KIA-${customerId}`)).toBeVisible();

  expect(apiUrls.filter((u) => u.includes("undefined"))).toEqual([]);
  expect(errors).toEqual([]);
});
