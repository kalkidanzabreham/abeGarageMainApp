import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowRight, LuCarFront, LuCheck, LuSearch, LuSparkles, LuSquarePen, LuUserPlus, LuX } from "react-icons/lu";
import Customers from "../../../services/customer.service";
import Vehicles from "../../../services/vehicle.service";
import { getAllServices } from "../../../services/service.service";
import { addOrder } from "../../../services/order.service";
import { useAuth } from "../../../Context/AuthContext";
import { formatPrice } from "../../../util/money";
import SmartIntake from "../SmartIntake/SmartIntake";
import PageHeader from "../ui/PageHeader";
import { GearSpinner, Plate } from "../ui/garage";

// Step header: number (or a check when done) and title.
function Step({ n, title, done, children, action }) {
  return (
    <section className={`gh-card gh-step-card ${done ? "is-done" : ""}`} aria-label={`Step ${n}: ${title}`}>
      <div className="gh-step-head">
        <span className="gh-step-badge">{done ? <LuCheck aria-hidden="true" /> : n}</span>
        <h2 className="h5 m-0">{title}</h2>
        {action && <div className="ms-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function NewOrder() {
  const navigate = useNavigate();
  const { employee, aiStatus } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  // the search text the current results belong to
  const [searchedTerm, setSearchedTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Search customers on the server once typing pauses (the list is
  // paginated, so filtering a downloaded list would only search page 1).
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setCustomers([]);
      setSearchedTerm("");
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      Customers.getCustomer({ q: term, page_size: 20 })
        .then((res) => res.json())
        .then((response) => {
          if (cancelled) return;
          setCustomers(response.data || []);
          setSearchedTerm(term);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    getAllServices().then((response) => setServices(response.data || []));
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    setVehicles(null);
    Vehicles.CustomerVehicle(selectedCustomer.customer_id).then((response) => setVehicles(response.data || []));
  }, [selectedCustomer]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
  };
  const clearCustomer = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setSelectedVehicle(null);
    setSelectedServices([]);
  };
  const clearVehicle = () => {
    setSelectedVehicle(null);
    setSelectedServices([]);
  };
  const toggleService = (serviceId) =>
    setSelectedServices((current) => (current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]));

  // live estimate for the person creating the order; the API computes and
  // stores the real total from the same catalog prices
  const estimatedTotal = services
    .filter((service) => selectedServices.includes(service.service_id))
    .reduce((sum, service) => sum + Number(service.service_price), 0);

  const handleSubmitOrder = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const response = await addOrder({
        employee_id: employee.employee_id,
        customer_id: selectedCustomer.customer_id,
        vehicle_id: selectedVehicle.vehicle_id,
        estimated_completion_date: estimatedCompletionDate,
        completion_date: null,
        order_completed: 0,
        order_services: selectedServices.map((serviceId) => ({ service_id: serviceId })),
      });
      if (response.status === "success") {
        navigate("/admin/orders");
        return;
      }
      // a failed submit used to do nothing at all
      setSubmitError(response.message || "The order couldn't be saved.");
    } catch {
      setSubmitError("The order couldn't be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Create a new order" subtitle="Pick the customer and their vehicle, then the services." />

      <div className="gh-order-steps">
        {/* 1. customer */}
        <Step
          n={1}
          title="Customer"
          done={Boolean(selectedCustomer)}
          action={
            selectedCustomer && (
              <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" onClick={clearCustomer}>
                <LuX aria-hidden="true" /> Change
              </button>
            )
          }
        >
          {!selectedCustomer ? (
            <>
              <div className="d-flex flex-wrap gap-2">
                <div className="gh-search flex-grow-1" style={{ maxWidth: "none" }}>
                  <LuSearch aria-hidden="true" />
                  <input
                    type="search"
                    name="search_customer"
                    className="form-control"
                    aria-label="Search customers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by first name, last name, email or phone"
                    autoComplete="off"
                  />
                </div>
                <Link to="/admin/add_customers" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                  <LuUserPlus aria-hidden="true" /> New customer
                </Link>
              </div>
              {aiStatus && (
                <p className="gh-hint" data-testid="intake-hint">
                  <LuSparkles aria-hidden="true" /> Pick a customer and their vehicle to use Smart intake: it drafts the services from the
                  customer&apos;s description.
                </p>
              )}
              {searchTerm.trim() !== "" && searchedTerm === searchTerm.trim() && (
                <div className="gh-table-wrap mt-3">
                  {customers.length === 0 ? (
                    <div className="gh-empty">
                      <p>No customers match “{searchedTerm}”.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <tbody>
                          {customers.map((customer) => (
                            <tr key={customer.customer_id}>
                              <td>
                                <div className="fw-semibold">
                                  {customer.customer_first_name} {customer.customer_last_name}
                                </div>
                                <div className="gh-muted small">{customer.customer_email}</div>
                              </td>
                              <td className="text-nowrap">{customer.customer_phone_number}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-dark btn-sm d-inline-flex align-items-center gap-1"
                                  onClick={() => selectCustomer(customer)}
                                  aria-label={`Select customer ${customer.customer_email}`}
                                >
                                  Select <LuArrowRight aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="gh-summary" data-testid="selected-customer">
              <span className="gh-avatar gh-avatar-sm" aria-hidden="true">
                {`${selectedCustomer.customer_first_name?.[0] ?? ""}${selectedCustomer.customer_last_name?.[0] ?? ""}`.toUpperCase()}
              </span>
              <div className="gh-summary-main">
                <div className="fw-semibold">
                  {selectedCustomer.customer_first_name} {selectedCustomer.customer_last_name}
                </div>
                <dl className="gh-inline-dl">
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedCustomer.customer_email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{selectedCustomer.customer_phone_number || "—"}</dd>
                  </div>
                  <div>
                    <dt>Active</dt>
                    <dd>{selectedCustomer.active_customer_status ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </div>
              <Link to={`/admin/customer_edit/${selectedCustomer.customer_id}`} className="gh-link-arrow small">
                <LuSquarePen aria-hidden="true" /> Edit customer
              </Link>
            </div>
          )}
        </Step>

        {/* 2. vehicle */}
        {selectedCustomer && (
          <Step
            n={2}
            title="Vehicle"
            done={Boolean(selectedVehicle)}
            action={
              selectedVehicle && (
                <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" onClick={clearVehicle}>
                  <LuX aria-hidden="true" /> Change
                </button>
              )
            }
          >
            {!selectedVehicle ? (
              vehicles === null ? (
                <div className="gh-skeleton" style={{ height: 80 }} />
              ) : vehicles.length === 0 ? (
                <div className="gh-empty">
                  <LuCarFront aria-hidden="true" />
                  <p>This customer has no vehicles yet.</p>
                  <Link to={`/admin/customer_profile/${selectedCustomer.customer_id}`} className="btn btn-primary btn-sm mt-2">
                    Add a vehicle on their profile
                  </Link>
                </div>
              ) : (
                <div className="gh-pick-grid">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.vehicle_id}
                      type="button"
                      className="gh-pick"
                      onClick={() => setSelectedVehicle(vehicle)}
                      aria-label={`Select vehicle ${vehicle.vehicle_tag}`}
                    >
                      <span className="gh-icon-tile">
                        <LuCarFront aria-hidden="true" />
                      </span>
                      <span className="gh-pick-main">
                        <strong>
                          {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                        </strong>
                        <span className="gh-muted small">
                          {vehicle.vehicle_color}
                          {vehicle.vehicle_mileage != null ? ` · ${Number(vehicle.vehicle_mileage).toLocaleString()}` : ""}
                        </span>
                      </span>
                      <Plate>{vehicle.vehicle_tag}</Plate>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="gh-summary" data-testid="selected-vehicle">
                <span className="gh-icon-tile">
                  <LuCarFront aria-hidden="true" />
                </span>
                <div className="gh-summary-main">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="fw-semibold">
                      {selectedVehicle.vehicle_year} {selectedVehicle.vehicle_make} {selectedVehicle.vehicle_model}
                    </span>
                    <Plate>{selectedVehicle.vehicle_tag}</Plate>
                  </div>
                  <dl className="gh-inline-dl">
                    <div>
                      <dt>Color</dt>
                      <dd>{selectedVehicle.vehicle_color || "—"}</dd>
                    </div>
                    <div>
                      <dt>Mileage</dt>
                      <dd>{selectedVehicle.vehicle_mileage != null ? Number(selectedVehicle.vehicle_mileage).toLocaleString() : "—"}</dd>
                    </div>
                    <div>
                      <dt>Serial</dt>
                      <dd>{selectedVehicle.vehicle_serial || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <Link to={`/admin/edit_vehicle/${selectedVehicle.vehicle_id}`} className="gh-link-arrow small">
                  <LuSquarePen aria-hidden="true" /> Edit vehicle
                </Link>
              </div>
            )}
          </Step>
        )}

        {/* 3. services (+ smart intake) */}
        {selectedVehicle && (
          <>
            {/* AI draft: suggestions only; the person ticks what to keep */}
            <SmartIntake onApply={(serviceIds) => setSelectedServices((current) => [...new Set([...current, ...serviceIds])])} />

            <Step n={3} title="Services" done={selectedServices.length > 0}>
              <div className="gh-service-pick">
                {services.map((service) => {
                  const checked = selectedServices.includes(service.service_id);
                  return (
                    <label key={service.service_id} className={`service-item gh-service-option ${checked ? "is-checked" : ""}`}>
                      <input type="checkbox" className="form-check-input" checked={checked} onChange={() => toggleService(service.service_id)} />
                      <span className="gh-service-option-main">
                        <strong>{service.service_name}</strong>
                        {service.service_description && <span className="gh-muted small">{service.service_description}</span>}
                      </span>
                      <span className="gh-price">{formatPrice(service.service_price)}</span>
                    </label>
                  );
                })}
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-6">
                  <label htmlFor="estimatedCompletionDate" className="form-label">
                    Estimated completion
                  </label>
                  <input
                    id="estimatedCompletionDate"
                    type="datetime-local"
                    className="form-control"
                    value={estimatedCompletionDate}
                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                  />
                </div>
              </div>
            </Step>

            <div className="gh-checkout">
              <div>
                <div className="gh-muted small">
                  Estimated total · {selectedServices.length} service{selectedServices.length === 1 ? "" : "s"}
                </div>
                <div className="gh-checkout-total" data-testid="estimated-total">
                  {formatPrice(estimatedTotal)}
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-2">
                {submitError && (
                  <div className="gh-alert gh-alert-danger m-0" role="alert">
                    {submitError}
                  </div>
                )}
                <button type="button" className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2" onClick={handleSubmitOrder} disabled={submitting}>
                  {submitting ? <GearSpinner /> : <LuCheck aria-hidden="true" />}
                  {submitting ? "Saving..." : "Submit Order"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default NewOrder;
