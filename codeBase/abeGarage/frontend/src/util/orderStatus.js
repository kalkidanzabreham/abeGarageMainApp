// The single mapping of order status values used by every screen.
// 0 = received, 1 = in progress, 2 = completed. (The edit page used to
// write 3 for "completed", which only some screens understood; migration
// 005 converts stored 3s to 2 and the API now rejects 3.)
export const ORDER_STATUS = Object.freeze({
  RECEIVED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
});

const META = {
  [ORDER_STATUS.RECEIVED]: { label: "Received", badge: "bg-warning", listClass: "status received" },
  [ORDER_STATUS.IN_PROGRESS]: { label: "In Progress", badge: "bg-primary", listClass: "status in-progress" },
  [ORDER_STATUS.COMPLETED]: { label: "Completed", badge: "bg-success", listClass: "status completed" },
};
const UNKNOWN = { label: "Unknown", badge: "bg-secondary", listClass: "status received" };

// The API names this field order_completed on /orders and /order/:id (and
// the tracking link) but order_status on the per-customer endpoints.
export const orderStatusOf = (order) => order?.order_status ?? order?.order_completed;

export const orderStatusMeta = (order) => META[orderStatusOf(order)] ?? UNKNOWN;
