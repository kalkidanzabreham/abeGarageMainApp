// Seed password rules (only the Demo password may be public).
const { seedPasswords, LOCAL_DEFAULT } = require("../db/seedPasswords");

const prod = (extra) => ({ NODE_ENV: "production", ...extra });
const valid = {
  SEED_DEMO_PASSWORD: "public-demo-pass",
  SEED_ADMIN_PASSWORD: "admin-pass-123456",
  SEED_MANAGER_PASSWORD: "manager-pass-123456",
  SEED_MECHANIC_PASSWORD: "mechanic-pass-123456",
};

test("outside production, unset passwords fall back to the local default", () => {
  expect(seedPasswords({ NODE_ENV: "development" })).toEqual({
    admin: LOCAL_DEFAULT, manager: LOCAL_DEFAULT, mechanic: LOCAL_DEFAULT, demo: LOCAL_DEFAULT,
  });
});

test("in production every password is required (no shared default)", () => {
  expect(() => seedPasswords(prod({}))).toThrow(
    /SEED_ADMIN_PASSWORD is required[\s\S]*SEED_MANAGER_PASSWORD[\s\S]*SEED_MECHANIC_PASSWORD[\s\S]*SEED_DEMO_PASSWORD/
  );
});

test("in production a staff password may not equal the public demo password", () => {
  expect(() => seedPasswords(prod({ ...valid, SEED_ADMIN_PASSWORD: valid.SEED_DEMO_PASSWORD }))).toThrow(
    /SEED_ADMIN_PASSWORD must differ from the public demo password/
  );
});

test("in production staff passwords need 12+ characters", () => {
  expect(() => seedPasswords(prod({ ...valid, SEED_MANAGER_PASSWORD: "short" }))).toThrow(
    /SEED_MANAGER_PASSWORD must be at least 12 characters/
  );
});

test("valid production passwords are returned per account", () => {
  expect(seedPasswords(prod(valid))).toEqual({
    admin: "admin-pass-123456", manager: "manager-pass-123456", mechanic: "mechanic-pass-123456", demo: "public-demo-pass",
  });
});
