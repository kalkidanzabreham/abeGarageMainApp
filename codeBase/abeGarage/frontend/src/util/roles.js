// Mirrors backend/config/roles.js and config/permissions.js.
// UI only: decides what to show. The API enforces the real permissions, so
// changing this file can never grant access.
export const ROLES = Object.freeze({
  MECHANIC: 1,
  MANAGER: 2,
  ADMIN: 3,
  DEMO: 4,
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.MECHANIC]: "Mechanic",
  [ROLES.MANAGER]: "Manager",
  [ROLES.ADMIN]: "Admin",
  [ROLES.DEMO]: "Demo (read-only)",
});

const { ADMIN, MANAGER, MECHANIC, DEMO } = ROLES;
export const ALL_ROLES = [ADMIN, MANAGER, MECHANIC, DEMO];

export const PERMISSIONS = Object.freeze({
  "customers:write": [ADMIN, MANAGER],
  "vehicles:write": [ADMIN, MANAGER],
  "orders:create": [ADMIN, MANAGER],
  "orders:update": [ADMIN, MANAGER, MECHANIC],
  "employees:read": [ADMIN, MANAGER, DEMO],
  "employees:write": [ADMIN],
  "services:write": [ADMIN],
});

export const can = (roleId, permission) =>
  (PERMISSIONS[permission] || []).includes(roleId);
