import { format } from "date-fns";
import { LuCarFront, LuCircleCheck, LuClock, LuUserRound } from "react-icons/lu";
import StatusPill from "../ui/StatusPill";
import { Plate } from "../ui/garage";
import { formatPrice } from "../../../util/money";
import { ORDER_STATUS, orderStatusOf } from "../../../util/orderStatus";

const STEPS = [
  { value: ORDER_STATUS.RECEIVED, label: "Received" },
  { value: ORDER_STATUS.IN_PROGRESS, label: "In progress" },
  { value: ORDER_STATUS.COMPLETED, label: "Completed" },
];

// Progress bar: received -> in progress -> completed.
function OrderProgress({ status }) {
  return (
    <ol className="gh-progress" aria-label="Order progress">
      {STEPS.map((step) => {
        // a completed order has nothing "current" left: every step is done
        const done = status > step.value || status === ORDER_STATUS.COMPLETED;
        const state = done ? "done" : status === step.value ? "current" : "todo";
        return (
          <li key={step.value} className={`gh-progress-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="gh-progress-dot">{state === "done" ? <LuCircleCheck aria-hidden="true" /> : null}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function InfoCard({ icon: Icon, label, title, rows }) {
  return (
    <div className="gh-card h-100">
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="gh-icon-tile">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <div className="gh-eyebrow">{label}</div>
          <div className="fw-semibold fs-5">{title}</div>
        </div>
      </div>
      <dl className="gh-dl">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// One order: status and progress, customer, vehicle, services and total.
// Used by the staff view (/admin/orders/:id) and the customer's tracking
// page (/customer_order/:hash).
export default function OrderDetails({ order, intro, actions }) {
  const status = orderStatusOf(order);
  const services = order.order_services || [];
  const done = services.filter((s) => s.service_completed === 1).length;

  return (
    <div className="gh-order">
      <div className="gh-card gh-order-head">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <div className="gh-eyebrow mb-1">
              Order #{order.order_id}
              {order.order_date ? ` · ${format(new Date(order.order_date), "d MMM yyyy")}` : ""}
            </div>
            <h1 className="h2 mb-1">
              {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
            </h1>
            <div className="gh-muted">
              for {order.customer_first_name} {order.customer_last_name}
            </div>
          </div>
          <StatusPill order={order} className="fs-6" />
        </div>
        {intro && <p className="gh-muted mt-3 mb-0">{intro}</p>}
        <OrderProgress status={status} />
        {actions && <div className="d-flex flex-wrap gap-2 mt-4">{actions}</div>}
      </div>

      <div className="row g-3 my-1">
        <div className="col-md-6">
          <InfoCard
            icon={LuUserRound}
            label="Customer"
            title={`${order.customer_first_name || ""} ${order.customer_last_name || ""}`}
            rows={[
              ["Email", order.customer_email],
              ["Phone", order.customer_phone_number],
            ]}
          />
        </div>
        <div className="col-md-6">
          <InfoCard
            icon={LuCarFront}
            label="Vehicle"
            title={`${order.vehicle_model || ""}${order.vehicle_color ? ` (${order.vehicle_color})` : ""}`}
            rows={[
              ["Plate", order.vehicle_tag ? <Plate>{order.vehicle_tag}</Plate> : null],
              ["Year", order.vehicle_year],
              ["Mileage", order.vehicle_mileage != null ? Number(order.vehicle_mileage).toLocaleString() : null],
            ]}
          />
        </div>
      </div>

      <section className="gh-card p-0 mt-2" aria-labelledby="services-title">
        <div className="gh-card-head">
          <h2 id="services-title" className="h5 m-0">
            Requested services
          </h2>
          <span className="gh-muted small">
            {done} of {services.length} done
          </span>
        </div>
        {services.length === 0 ? (
          <p className="gh-muted p-4 m-0">No services on this order.</p>
        ) : (
          <ul className="gh-service-list">
            {services.map((service, index) => (
              <li key={service.service_id ?? index} className="gh-service-row">
                <span className={`gh-service-check ${service.service_completed === 1 ? "is-done" : ""}`}>
                  {service.service_completed === 1 ? <LuCircleCheck aria-hidden="true" /> : <LuClock aria-hidden="true" />}
                </span>
                <span className="gh-service-main">
                  <strong>{service.service_name}</strong>
                  {service.service_description && <span className="gh-muted">{service.service_description}</span>}
                </span>
                <span className="gh-service-price">{formatPrice(service.service_price)}</span>
                <span className={`gh-pill ${service.service_completed === 1 ? "gh-pill-green" : "gh-pill-blue"}`}>
                  {service.service_completed === 1 ? "Done" : "In progress"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {/* order total: computed by the API from catalog prices */}
        <div className="gh-order-total">
          <span>Total</span>
          <strong data-testid="order-total">{formatPrice(order.order_total_price)}</strong>
        </div>
      </section>
    </div>
  );
}
