import { orderStatusMeta } from "../../../util/orderStatus";

// An order's status as a colored pill (amber received, blue in progress,
// green completed). util/orderStatus.js is the one mapping for all screens.
export default function StatusPill({ order, className = "" }) {
  const { label, pill } = orderStatusMeta(order);
  return <span className={`gh-pill ${pill} status-badge ${className}`}>{label}</span>;
}
