// company_roles.company_role_id values. The DB rows are created by
// migrations 001 and 002; these ids must match them.
const ROLES = Object.freeze({
  MECHANIC: 1, // was "Employee" before migration 002
  MANAGER: 2,
  ADMIN: 3,
  DEMO: 4, // read-only account for public demos
});

module.exports = { ROLES };
