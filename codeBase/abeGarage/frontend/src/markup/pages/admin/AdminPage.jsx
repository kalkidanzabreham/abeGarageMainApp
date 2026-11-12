import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  LuArrowRight,
  LuCircleCheck,
  LuClipboardList,
  LuContact,
  LuFilePlus2,
  LuSparkles,
  LuTimer,
  LuUserPlus,
  LuUsers,
  LuWrench,
} from "react-icons/lu";
import PageHeader from "../../components/ui/PageHeader";
import StatusPill from "../../components/ui/StatusPill";
import { useAuth } from "../../../Context/AuthContext";
import { canVisit } from "../../../util/roles";
import { getAllOrders } from "../../../services/order.service";
import customers from "../../../services/customer.service";
import { ORDER_STATUS } from "../../../util/orderStatus";
import { formatPrice } from "../../../util/money";

// The list endpoints report a total in their pagination, so one tiny
// request (page_size=1) per number is enough; no stats endpoint needed.
const totalOf = (body) => body?.pagination?.total ?? null;

async function loadStats() {
  const [received, inProgress, completed, customerRes, recent] = await Promise.all([
    getAllOrders({ page_size: 1, status: ORDER_STATUS.RECEIVED }),
    getAllOrders({ page_size: 1, status: ORDER_STATUS.IN_PROGRESS }),
    getAllOrders({ page_size: 1, status: ORDER_STATUS.COMPLETED }),
    customers.getCustomer({ page_size: 1 }).then((r) => r.json()),
    getAllOrders({ page_size: 5 }),
  ]);
  return {
    received: totalOf(received),
    inProgress: totalOf(inProgress),
    completed: totalOf(completed),
    customers: totalOf(customerRes),
    recent: recent?.data ?? [],
  };
}

const QUICK_ACTIONS = [
  { to: "/admin/new-order", label: "New order", text: "Pick a customer and vehicle, then the services.", icon: LuFilePlus2 },
  { to: "/admin/smart-intake", label: "Smart intake", text: "Draft a job card from a complaint.", icon: LuSparkles, ai: true },
  { to: "/admin/orders", label: "All orders", text: "Filter by status and update progress.", icon: LuClipboardList },
  { to: "/admin/all_customers", label: "Customers", text: "Search customers and their vehicles.", icon: LuUsers },
  { to: "/admin/add_customers", label: "Add customer", text: "Register a new customer.", icon: LuUserPlus },
  { to: "/admin/employee", label: "Employees", text: "Staff accounts and roles.", icon: LuContact },
  { to: "/admin/service", label: "Services", text: "The catalog and its prices.", icon: LuWrench },
];

function StatCard({ label, value, icon: Icon, tone, hint }) {
  return (
    <div className="gh-card gh-stat">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="gh-stat-label">{label}</div>
          {value === null ? (
            <div className="gh-skeleton" style={{ width: 64, height: 36, marginTop: 6 }} />
          ) : (
            <div className="gh-stat-value">{value}</div>
          )}
        </div>
        <span className={`gh-icon-tile ${tone || ""}`}>
          <Icon aria-hidden="true" />
        </span>
      </div>
      {hint && <div className="gh-stat-hint">{hint}</div>}
    </div>
  );
}

function AdminPage() {
  const { roleId, aiStatus, employee, can } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStats()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // everyone may view the catalog; only roles with services:write edit it
  const actions = QUICK_ACTIONS.filter((a) => canVisit(roleId, a.to) && (!a.ai || aiStatus)).map((a) =>
    a.to === "/admin/service" && can("services:write") ? { ...a, label: "Manage services", text: "Add services and change prices." } : a
  );
  const open = stats ? stats.received + stats.inProgress : null;

  return (
    <>
      <PageHeader
        eyebrow={format(new Date(), "EEEE, d MMMM")}
        title="Dashboard"
        subtitle={`Here's the workshop at a glance${employee?.employee_first_name ? `, ${employee.employee_first_name}` : ""}.`}
        actions={
          canVisit(roleId, "/admin/new-order") && (
            <Link to="/admin/new-order" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <LuFilePlus2 aria-hidden="true" /> New order
            </Link>
          )
        }
      />

      {error && (
        <div className="gh-alert gh-alert-danger" role="alert">
          Couldn&apos;t load the numbers. Please reload the page.
        </div>
      )}

      <section className="gh-stats gh-stagger" aria-label="Workshop numbers">
        <StatCard label="Open orders" value={open} icon={LuClipboardList} hint="Received or in progress" />
        <StatCard label="Waiting to start" value={stats?.received ?? null} icon={LuTimer} hint="Status: received" />
        <StatCard label="Completed" value={stats?.completed ?? null} icon={LuCircleCheck} tone="gh-tile-green" hint="All time" />
        <StatCard label="Customers" value={stats?.customers ?? null} icon={LuUsers} tone="gh-tile-blue" hint="Registered" />
      </section>

      <div className="gh-dash-grid">
        <section className="gh-card p-0" aria-labelledby="recent-orders-title">
          <div className="gh-card-head">
            <h2 id="recent-orders-title" className="h5 m-0">
              Latest orders
            </h2>
            <Link to="/admin/orders" className="gh-link-arrow">
              View all <LuArrowRight aria-hidden="true" />
            </Link>
          </div>
          {!stats ? (
            <div className="p-3 d-grid gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="gh-skeleton" style={{ height: 44 }} />
              ))}
            </div>
          ) : stats.recent.length === 0 ? (
            <p className="gh-muted p-4 m-0">No orders yet.</p>
          ) : (
            <ul className="gh-recent">
              {stats.recent.map((o) => (
                <li key={o.order_id}>
                  <Link to={`/admin/orders/${o.order_id}`} className="gh-recent-row">
                    <span className="gh-recent-id">#{o.order_id}</span>
                    <span className="gh-recent-main">
                      <strong>
                        {o.customer_first_name} {o.customer_last_name}
                      </strong>
                      <span className="gh-muted">
                        {o.vehicle_year} {o.vehicle_make} {o.vehicle_model} · {format(new Date(o.order_date), "d MMM")}
                      </span>
                    </span>
                    <span className="gh-recent-total">{formatPrice(o.order_total_price)}</span>
                    <StatusPill order={o} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="h5 mb-3">
            Quick actions
          </h2>
          <div className="gh-actions gh-stagger">
            {actions.map(({ to, label, text, icon: Icon }) => (
              <Link key={to} to={to} className="gh-card gh-card-hover gh-action">
                <span className="gh-icon-tile">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>{label}</strong>
                  <span className="gh-muted">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default AdminPage;
