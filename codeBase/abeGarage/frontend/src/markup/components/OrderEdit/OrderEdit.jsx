import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuCheck, LuPlus, LuX } from "react-icons/lu";
import { getAllServices } from "../../../services/service.service";
import { getOrderById, updateOrder } from "../../../services/order.service";
import { formatPrice } from "../../../util/money";
import { ORDER_STATUS } from "../../../util/orderStatus";
import PageHeader from "../ui/PageHeader";
import StatusPill from "../ui/StatusPill";
import { GearSpinner, Plate } from "../ui/garage";

// value for a datetime-local input, in local time
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    getOrderById(id).then((response) => {
      const orderData = response[0];
      setOrder(orderData);
      setEstimatedCompletionDate(formatDateForInput(orderData.estimated_completion_date));
      setOrderCompleted(orderData.order_completed);
      setSelectedServices(orderData.order_services);
    });
    getAllServices().then((response) => setServices(response.data || []));
  }, [id]);

  const handleServiceCompletion = (serviceId, completed) => {
    const updated = selectedServices.map((s) => (s.service_id === serviceId ? { ...s, service_completed: completed } : s));
    setSelectedServices(updated);
    // every service done while in progress: the order is completed
    // (this used to write 3, which the tracking page could not display)
    if (updated.every((s) => s.service_completed === 1) && orderCompleted !== ORDER_STATUS.RECEIVED) {
      setOrderCompleted(ORDER_STATUS.COMPLETED);
    }
  };

  const handleAddService = (serviceId) => {
    if (!selectedServices.find((s) => s.service_id === serviceId)) {
      setSelectedServices([...selectedServices, { service_id: serviceId, service_completed: 0 }]);
    }
  };

  const handleRemoveService = (serviceId) => setSelectedServices(selectedServices.filter((s) => s.service_id !== serviceId));

  const handleStartedChange = (e) => setOrderCompleted(e.target.checked ? ORDER_STATUS.IN_PROGRESS : ORDER_STATUS.RECEIVED);

  const handleSubmitOrder = async () => {
    setSaveError("");
    setSaving(true);
    try {
      const response = await updateOrder(id, {
        order_id: order.order_id,
        estimated_completion_date: estimatedCompletionDate,
        order_completed: orderCompleted,
        order_services: selectedServices,
      });
      if (response.status === "success") {
        navigate("/admin/orders");
        return;
      }
      setSaveError(response.message || "The order couldn't be saved.");
    } catch {
      setSaveError("The order couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // catalog price of a service (services added during this edit carry no
  // price of their own); the API recomputes the stored total on save
  const serviceById = (serviceId) => services.find((s) => s.service_id === serviceId);
  const estimatedTotal = selectedServices.reduce((sum, s) => sum + Number(serviceById(s.service_id)?.service_price || 0), 0);
  const available = services.filter((service) => !selectedServices.find((s) => s.service_id === service.service_id));
  const done = selectedServices.filter((s) => s.service_completed === 1).length;

  if (!order) {
    return <div className="gh-skeleton" style={{ height: 320 }} aria-busy="true" />;
  }

  return (
    <>
      <Link to={`/admin/orders/${order.order_id}`} className="gh-back-link mb-3">
        <LuArrowLeft aria-hidden="true" /> Order #{order.order_id}
      </Link>
      <PageHeader
        eyebrow={`Edit order #${order.order_id}`}
        title={`${order.vehicle_year ?? ""} ${order.vehicle_make ?? ""} ${order.vehicle_model ?? ""}`.trim() || "Edit order"}
        subtitle={`for ${order.customer_first_name ?? ""} ${order.customer_last_name ?? ""}`}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Plate>{order.vehicle_tag}</Plate>
            <StatusPill order={{ order_completed: orderCompleted }} />
          </div>
        }
      />

      <div className="gh-split">
        <div className="d-grid gap-3">
          <section className="gh-card" aria-labelledby="progress-title">
            <h2 id="progress-title" className="h5 mb-3">
              Progress
            </h2>
            <div className="form-check form-switch mb-3">
              <input className="form-check-input" type="checkbox" role="switch" id="orderCompleted" checked={orderCompleted !== 0} onChange={handleStartedChange} />
              <label className="form-check-label" htmlFor="orderCompleted">
                Work has started (in progress)
              </label>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
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
          </section>

          <section className="gh-card p-0" aria-labelledby="services-title">
            <div className="gh-card-head">
              <h2 id="services-title" className="h5 m-0">
                Services on this order
              </h2>
              <span className="gh-muted small">
                {done} of {selectedServices.length} done
              </span>
            </div>
            {orderCompleted === ORDER_STATUS.RECEIVED && selectedServices.length > 0 && (
              <p className="gh-hint mx-3 mt-3 mb-0">Turn on “Work has started” to mark services as completed.</p>
            )}
            <ul className="gh-service-list">
              {selectedServices.map((service) => {
                const info = serviceById(service.service_id);
                return (
                  <li className="service-item gh-service-row gh-service-edit" key={service.service_id}>
                    <span className="gh-service-main">
                      <strong>{info?.service_name}</strong>
                      <span className="gh-muted">{formatPrice(info?.service_price)}</span>
                    </span>
                    <select
                      className="form-select form-select-sm"
                      aria-label={`Status of ${info?.service_name ?? "service"}`}
                      value={service.service_completed}
                      onChange={(e) => handleServiceCompletion(service.service_id, parseInt(e.target.value, 10))}
                      disabled={orderCompleted !== ORDER_STATUS.IN_PROGRESS} // only while in progress
                    >
                      <option value={0}>In Progress</option>
                      <option value={1}>Completed</option>
                    </select>
                    <button
                      type="button"
                      className="gh-icon-btn gh-icon-btn-danger"
                      onClick={() => handleRemoveService(service.service_id)}
                      aria-label={`Remove ${info?.service_name ?? "service"}`}
                      title="Remove"
                    >
                      <LuX />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {available.length > 0 && (
            <section className="gh-card" aria-labelledby="add-services-title">
              <h2 id="add-services-title" className="h5 mb-3">
                Add services
              </h2>
              <div className="gh-pick-grid">
                {available.map((service) => (
                  <button key={service.service_id} type="button" className="gh-pick" onClick={() => handleAddService(service.service_id)}>
                    <span className="gh-pick-main">
                      <strong>{service.service_name}</strong>
                      <span className="gh-muted small">{formatPrice(service.service_price)}</span>
                    </span>
                    <LuPlus aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="gh-card gh-sticky" aria-label="Order total">
          <div className="gh-muted small">Estimated total</div>
          <div className="gh-checkout-total" data-testid="estimated-total">
            {formatPrice(estimatedTotal)}
          </div>
          <p className="gh-muted small">The saved total is recalculated from catalog prices.</p>
          {saveError && (
            <div className="gh-alert gh-alert-danger" role="alert">
              {saveError}
            </div>
          )}
          <button type="button" className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={handleSubmitOrder} disabled={saving}>
            {saving ? <GearSpinner /> : <LuCheck aria-hidden="true" />}
            {saving ? "Saving..." : "Update Order"}
          </button>
        </aside>
      </div>
    </>
  );
}

export default EditOrder;
