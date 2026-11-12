import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { LuArrowLeft, LuCarFront, LuClipboardList, LuFilePlus2, LuMail, LuPhone, LuPlus, LuSquarePen, LuX } from "react-icons/lu";
import AddVechile from "../../../pages/admin/AddVechile";
import customerService from "../../../../services/customer.service";
import vehicles from "../../../../services/vehicle.service";
import { singleCustomersOrder } from "../../../../services/order.service";
import { useAuth } from "../../../../Context/AuthContext";
import { formatPrice } from "../../../../util/money";
import StatusPill from "../../ui/StatusPill";
import { Plate } from "../../ui/garage";

// One customer: details, vehicles (with an inline "add vehicle" form) and
// order history. The id always comes from the URL: children used to read it
// from customer data that was still empty on the first render and fetched
// ".../undefined" (walkthrough bug 1).
function CustomerProfile() {
  const { customer_id } = useParams();
  const { can } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [vehicleList, setVehicleList] = useState(null);
  const [orders, setOrders] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    customerService
      .singleCustomer(customer_id)
      .then((res) => res.json())
      .then((body) => !cancelled && setCustomer(body.data?.[0] ?? false))
      .catch(() => !cancelled && setCustomer(false));
    // an error response has no data array: show an empty list, not a crash
    vehicles.CustomerVehicle(customer_id).then((data) => !cancelled && setVehicleList(data?.data ?? []));
    singleCustomersOrder(customer_id)
      .then((res) => !cancelled && setOrders(res?.data ?? []))
      .catch(() => !cancelled && setOrders([]));
    return () => {
      cancelled = true;
    };
  }, [customer_id]);

  if (customer === false) {
    return (
      <div className="gh-alert gh-alert-danger" role="alert">
        Customer not found.
      </div>
    );
  }

  const name = customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : "";

  return (
    <>
      <Link to="/admin/all_customers" className="gh-back-link mb-3">
        <LuArrowLeft aria-hidden="true" /> All customers
      </Link>

      {/* details */}
      <section className="gh-card gh-profile-head mt-3" aria-label="Customer details">
        {!customer ? (
          <div className="gh-skeleton" style={{ height: 72 }} />
        ) : (
          <>
            <span className="gh-avatar gh-avatar-lg" aria-hidden="true">
              {`${customer.customer_first_name?.[0] ?? ""}${customer.customer_last_name?.[0] ?? ""}`.toUpperCase()}
            </span>
            <div className="gh-profile-main">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <h1 className="h3 m-0">{name}</h1>
                {customer.active_customer_status ? <span className="gh-pill gh-pill-green">Active</span> : <span className="gh-pill">Inactive</span>}
              </div>
              <div className="gh-profile-contacts">
                <span>
                  <LuMail aria-hidden="true" /> {customer.customer_email}
                </span>
                {customer.customer_phone_number && (
                  <span>
                    <LuPhone aria-hidden="true" /> {customer.customer_phone_number}
                  </span>
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {can("customers:write") && (
                <Link to={`/admin/customer_edit/${customer_id}`} className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                  <LuSquarePen aria-hidden="true" /> Edit
                </Link>
              )}
              {can("orders:create") && (
                <Link to="/admin/new-order" className="btn btn-primary d-inline-flex align-items-center gap-2">
                  <LuFilePlus2 aria-hidden="true" /> New order
                </Link>
              )}
            </div>
          </>
        )}
      </section>

      {/* vehicles */}
      <section className="mt-4" aria-labelledby="vehicles-title">
        <div className="gh-section-row">
          <h2 id="vehicles-title" className="h5 m-0">
            Vehicles {vehicleList && <span className="gh-count">{vehicleList.length}</span>}
          </h2>
          {can("vehicles:write") && (
            <button type="button" className={`btn ${adding ? "btn-outline-secondary" : "btn-dark"} btn-sm d-inline-flex align-items-center gap-2`} onClick={() => setAdding((a) => !a)}>
              {adding ? <LuX aria-hidden="true" /> : <LuPlus aria-hidden="true" />}
              {adding ? "Cancel" : "Add Vehicle"}
            </button>
          )}
        </div>

        {adding && (
          <div className="mb-3 gh-page">
            <AddVechile customer_id={customer_id} onVehicleAdded={() => setAdding(false)} />
          </div>
        )}

        {!vehicleList ? (
          <div className="gh-skeleton" style={{ height: 120 }} />
        ) : vehicleList.length === 0 ? (
          <div className="gh-card gh-empty">
            <LuCarFront aria-hidden="true" />
            <p>No vehicles yet.{can("vehicles:write") ? " Add one to create an order." : ""}</p>
          </div>
        ) : (
          <div className="gh-vehicle-grid gh-stagger">
            {vehicleList.map((v) => (
              <article key={v.vehicle_id} className="gh-card gh-card-hover gh-vehicle">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <span className="gh-icon-tile">
                    <LuCarFront aria-hidden="true" />
                  </span>
                  <Plate>{v.vehicle_tag}</Plate>
                </div>
                <h3 className="h6 fw-semibold mt-3 mb-1">
                  {v.vehicle_year} {v.vehicle_make} {v.vehicle_model}
                </h3>
                <dl className="gh-vehicle-specs">
                  {v.vehicle_color && (
                    <div>
                      <dt>Color</dt>
                      <dd>{v.vehicle_color}</dd>
                    </div>
                  )}
                  {v.vehicle_mileage != null && (
                    <div>
                      <dt>Mileage</dt>
                      <dd>{Number(v.vehicle_mileage).toLocaleString()}</dd>
                    </div>
                  )}
                  {v.vehicle_type && (
                    <div>
                      <dt>Type</dt>
                      <dd>{v.vehicle_type}</dd>
                    </div>
                  )}
                  {v.vehicle_serial && (
                    <div>
                      <dt>Serial</dt>
                      <dd>{v.vehicle_serial}</dd>
                    </div>
                  )}
                </dl>
                {can("vehicles:write") && (
                  <Link to={`/admin/edit_vehicle/${v.vehicle_id}`} className="gh-link-arrow small">
                    <LuSquarePen aria-hidden="true" /> Edit vehicle
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* orders */}
      <section className="mt-4" aria-labelledby="orders-title">
        <div className="gh-section-row">
          <h2 id="orders-title" className="h5 m-0">
            Order history {orders && <span className="gh-count">{orders.length}</span>}
          </h2>
        </div>
        {!orders ? (
          <div className="gh-skeleton" style={{ height: 120 }} />
        ) : orders.length === 0 ? (
          <div className="gh-card gh-empty">
            <LuClipboardList aria-hidden="true" />
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="gh-table-wrap">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Date</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Received by</th>
                    {orders.some((o) => o.order_total_price != null) && (
                      <th scope="col" className="text-end">
                        Total
                      </th>
                    )}
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td>
                        <Link to={`/admin/orders/${order.order_id}`} className="fw-semibold">
                          #{order.order_id}
                        </Link>
                      </td>
                      <td className="text-nowrap gh-muted">{format(new Date(order.order_date), "d MMM yyyy")}</td>
                      <td>
                        <div className="fw-semibold">
                          {order.vehicle_make || order.vehicle_type} {order.vehicle_model || ""} {order.vehicle_year ? `(${order.vehicle_year})` : ""}
                        </div>
                        {order.vehicle_tag && <Plate>{order.vehicle_tag}</Plate>}
                      </td>
                      <td className="text-nowrap">
                        {order.employee_first_name} {order.employee_last_name}
                      </td>
                      {orders.some((o) => o.order_total_price != null) && <td className="text-end gh-num">{formatPrice(order.order_total_price)}</td>}
                      <td>
                        <StatusPill order={order} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default CustomerProfile;
