// The role matrix: the ONLY place that decides which role may do what.
// Routes ask for a permission (authorize("orders:read")), never for a role.
const { ROLES } = require("./roles");

const { ADMIN, MANAGER, MECHANIC, DEMO } = ROLES;
const STAFF = [ADMIN, MANAGER, MECHANIC];
const EVERYONE = [...STAFF, DEMO]; // Demo: GET routes only

const PERMISSIONS = Object.freeze({
  "customers:read": EVERYONE,
  "customers:write": [ADMIN, MANAGER],
  "vehicles:read": EVERYONE,
  "vehicles:write": [ADMIN, MANAGER],
  "orders:read": EVERYONE,
  "orders:create": [ADMIN, MANAGER],
  // mechanics do the work, so they record job progress on orders
  "orders:update": [ADMIN, MANAGER, MECHANIC],
  "employees:read": [ADMIN, MANAGER, DEMO],
  "employees:write": [ADMIN],
  "services:read": EVERYONE,
  "services:write": [ADMIN],
});

module.exports = { PERMISSIONS };
