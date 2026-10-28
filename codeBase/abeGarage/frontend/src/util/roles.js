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

// Which staff pages each role may open. The route guards in App.jsx, the
// admin side menu and the dashboard cards all read this map, so a link is
// never shown for a page that would redirect to /unauthorized.
export const PAGE_ROLES = Object.freeze({
  "/admin": ALL_ROLES,
  "/admin/orders": ALL_ROLES,
  "/admin/new-order": PERMISSIONS["orders:create"],
  "/admin/add-employee": PERMISSIONS["employees:write"],
  "/admin/employee": PERMISSIONS["employees:read"],
  "/admin/add_customers": PERMISSIONS["customers:write"],
  "/admin/all_customers": ALL_ROLES,
  "/admin/service": ALL_ROLES,
});

export const canVisit = (roleId, path) =>
  (PAGE_ROLES[path.toLowerCase()] || []).includes(roleId);
