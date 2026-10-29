// Passwords for the seeded accounts.
// Only the Demo account's password is meant to be public (it is read-only).
// Each staff account gets its own password from an env var:
//   SEED_ADMIN_PASSWORD, SEED_MANAGER_PASSWORD, SEED_MECHANIC_PASSWORD,
//   SEED_DEMO_PASSWORD
// Outside production an unset value falls back to LOCAL_DEFAULT so a local
// setup works out of the box. In production there is no default: every
// variable is required, staff passwords need 12+ characters and none may
// equal the public Demo password.
const LOCAL_DEFAULT = "GarageHub-demo-1";
const STAFF = ["admin", "manager", "mechanic"];
const ROLES = [...STAFF, "demo"];

const envName = (role) => `SEED_${role.toUpperCase()}_PASSWORD`;

const seedPasswords = (env = process.env) => {
  const production = env.NODE_ENV === "production";
  const passwords = {};
  const problems = [];
  for (const role of ROLES) {
    const value = env[envName(role)];
    if (value) passwords[role] = value;
    else if (production) problems.push(`${envName(role)} is required in production`);
    else passwords[role] = LOCAL_DEFAULT;
  }
  if (production && passwords.demo) {
    for (const role of STAFF) {
      const value = passwords[role];
      if (!value) continue;
      if (value.length < 12) problems.push(`${envName(role)} must be at least 12 characters`);
      if (value === passwords.demo) problems.push(`${envName(role)} must differ from the public demo password`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Seed passwords:\n  - ${problems.join("\n  - ")}`);
  }
  return passwords;
};

module.exports = { seedPasswords, LOCAL_DEFAULT, envName };
