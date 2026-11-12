// Smart job intake in the browser, with the no-model fake provider
// (AI_PROVIDER=fake). These test the UI and the human-confirm flow; the
// model's quality is measured separately by eval/.
const { test, expect } = require("@playwright/test");
const { apiLogin, apiAs, loginAs, createCustomerWithVehicle, servicePrices } = require("./helpers");

const money = (n) => `$${n.toFixed(2)}`;

test("Manager: the draft only fills the form after confirmation, and nothing is saved until Submit", async ({ page, request }) => {
  const customer = await createCustomerWithVehicle(request, "Intake");
  const prices = await servicePrices(request);
  const admin = apiAs(request, await apiLogin(request, "admin"));
  const ordersBefore = (await (await admin.get("/orders?page_size=1")).json()).pagination.total;

  await loginAs(page, request, "manager");
  await page.goto("/admin/new-order");
  await page.fill("input[name=search_customer]", customer.email);
  await page.locator(`table tr:has-text("${customer.email}") svg`).click();
  await page.locator(`table tr:has-text("${customer.tag}") svg`).click();

  const intake = page.getByTestId("smart-intake");
  await intake.locator("textarea[name=complaint]").fill("Grinding noise when I brake, and the battery died this morning");
  await intake.getByRole("button", { name: "Draft job card" }).click();
  const draft = page.getByTestId("ai-draft");
  await expect(draft).toContainText("Urgency: high");
  await expect(draft.getByLabel(/Brake pad replacement/)).toBeChecked();
  await expect(draft.getByLabel(/Battery replacement/)).toBeChecked();

  // drafted but not applied: the order's own service checkboxes are untouched
  await expect(page.getByTestId("estimated-total")).toHaveText("$0.00");

  // the person unticks one suggestion, then applies the rest
  await draft.getByLabel(/Battery replacement/).uncheck();
  await draft.getByRole("button", { name: "Add checked services to this order" }).click();
  await expect(page.getByTestId("estimated-total")).toHaveText(money(prices["Brake pad replacement"].price));

  // still nothing saved
  expect((await (await admin.get("/orders?page_size=1")).json()).pagination.total).toBe(ordersBefore);

  await page.click("button:has-text('Submit Order')");
  await expect(page).toHaveURL(/\/admin\/orders$/);
  expect((await (await admin.get("/orders?page_size=1")).json()).pagination.total).toBe(ordersBefore + 1);
});

test("Demo can try smart intake on its own page, with no way to save", async ({ page, request }) => {
  await loginAs(page, request, "demo");
  await page.goto("/admin");
  await page.getByRole("link", { name: "Smart intake (AI)" }).click();
  // the fake provider is local: no third-party sentence, but the warning stays
  await expect(page.getByTestId("ai-privacy-note")).toHaveText(
    "Don't enter names, phone numbers or other personal details. The text itself is not stored."
  );
  await page.locator("textarea[name=complaint]").fill("car shakes above 80");
  await page.getByRole("button", { name: "Draft job card" }).click();
  await expect(page.getByTestId("ai-draft")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add checked services to this order" })).toHaveCount(0);
});

test("Mechanic has no smart intake menu item or page", async ({ page, request }) => {
  await loginAs(page, request, "mechanic");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Smart intake (AI)" })).toHaveCount(0);
  await page.goto("/admin/smart-intake");
  await expect(page).toHaveURL(/\/unauthorized$/);
});

test("daily cap: the panel says the feature is paused", async ({ page, request }) => {
  await page.route("**/api/ai/status", (route) =>
    route.fulfill({ json: { enabled: true, available: false, reason: "DAILY_CAP_REACHED", provider: "fake", model: null, max_input_chars: 1000 } })
  );
  await loginAs(page, request, "demo");
  await page.goto("/admin/smart-intake");
  await expect(page.getByRole("status")).toContainText("reached today's limit and is paused");
  await expect(page.getByRole("button", { name: "Draft job card" })).toHaveCount(0);
});

test("a failed draft shows a clear message instead of a broken form", async ({ page, request }) => {
  await page.route("**/api/ai/intake", (route) =>
    route.fulfill({ status: 502, json: { status: "error", code: "AI_DRAFT_FAILED", message: "Couldn't produce a usable draft. Please fill in the order manually." } })
  );
  await loginAs(page, request, "demo");
  await page.goto("/admin/smart-intake");
  await page.locator("textarea[name=complaint]").fill("brakes");
  await page.getByRole("button", { name: "Draft job card" }).click();
  await expect(page.getByRole("alert")).toHaveText("Couldn't produce a usable draft. Please fill in the order manually.");
});

test("AI_ENABLED=false (status 404): no menu item and no panel", async ({ page, request }) => {
  await page.route("**/api/ai/status", (route) => route.fulfill({ status: 404, json: { status: "error", code: "NOT_FOUND" } }));
  await loginAs(page, request, "manager");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Smart intake (AI)" })).toHaveCount(0);
  await page.goto("/admin/smart-intake");
  await expect(page.getByText("Smart intake is not available.")).toBeVisible();
});

test("hosted provider: the note says the text goes to a third-party AI service", async ({ page, request }) => {
  await page.route("**/api/ai/status", (route) =>
    route.fulfill({ json: { enabled: true, available: true, reason: null, provider: "gemini", model: "gemini-2.5-flash-lite", external: true, max_input_chars: 1000 } })
  );
  await loginAs(page, request, "demo");
  await page.goto("/admin/smart-intake");
  await expect(page.getByTestId("ai-privacy-note")).toContainText("sent to a third-party AI service (Google Gemini)");
  await expect(page.getByTestId("ai-privacy-note")).toContainText("Don't enter names, phone numbers or other personal details.");
});

test("provider busy (AI_BUSY): a try-again message, and the panel stays usable", async ({ page, request }) => {
  await page.route("**/api/ai/intake", (route) =>
    route.fulfill({ status: 503, json: { status: "error", code: "AI_BUSY", message: "Smart intake is busy right now. Please try again in a minute, or fill in the order manually." } })
  );
  await loginAs(page, request, "demo");
  await page.goto("/admin/smart-intake");
  await page.locator("textarea[name=complaint]").fill("brakes");
  await page.getByRole("button", { name: "Draft job card" }).click();
  await expect(page.getByRole("alert")).toHaveText("Smart intake is busy right now. Please try again in a minute, or fill in the order manually.");
  await expect(page.getByRole("button", { name: "Draft job card" })).toBeEnabled();
});
