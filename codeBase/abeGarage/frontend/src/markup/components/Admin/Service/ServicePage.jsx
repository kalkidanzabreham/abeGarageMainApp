import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { LuPlus, LuSquarePen, LuTrash2, LuWrench, LuX } from "react-icons/lu";
import { getAllServices, addServiceService, updateServiceService, deleteServiceService } from "../../../../services/service.service";
import { useAuth } from "../../../../Context/AuthContext";
import { formatPrice } from "../../../../util/money";
import PageHeader from "../../ui/PageHeader";

const EMPTY_SERVICE = { service_name: "", service_description: "", service_price: "" };

function ServicePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [newService, setNewService] = useState(EMPTY_SERVICE);
  const { isDemo, can } = useAuth();
  // admins edit the catalog; Demo sees the controls so it gets the friendly
  // "the demo account cannot..." message instead of a silent 403
  const canEdit = can("services:write") || isDemo;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await getAllServices();
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const demoBlocked = (action) => {
    if (!isDemo) return false;
    Swal.fire("Access Denied", `The demo account cannot ${action} Services.`, "warning");
    return true;
  };

  // API errors ({ status: "error", message }) were once silently ignored
  const showApiError = (response) => {
    if (response && response.status === "error") {
      Swal.fire("Error", response.message, "error");
      return true;
    }
    return false;
  };

  const addService = async () => {
    if (demoBlocked("add")) return;
    if (!newService.service_name || newService.service_price === "") return;
    try {
      const response = await addServiceService(newService);
      if (showApiError(response)) return;
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const updateService = async () => {
    if (demoBlocked("update")) return;
    if (!serviceToEdit || !newService.service_name || newService.service_price === "") return;
    try {
      const response = await updateServiceService(newService, serviceToEdit);
      if (showApiError(response)) return;
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (service) => {
    if (demoBlocked("delete")) return;
    const result = await Swal.fire({
      title: `Delete “${service.service_name}”?`,
      text: "It will no longer be offered on new orders.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const response = await deleteServiceService(service.service_id);
      if (showApiError(response)) return;
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleSubmit = (e) => {
    // without this the browser reloads the page and can cancel the request
    e.preventDefault();
    serviceToEdit ? updateService() : addService();
  };

  const editService = (service) => {
    if (demoBlocked("edit")) return;
    setNewService({
      service_name: service.service_name,
      service_description: service.service_description,
      service_price: service.service_price,
    });
    setServiceToEdit(service);
    document.getElementById("service-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetForm = () => {
    setNewService(EMPTY_SERVICE);
    setServiceToEdit(null);
  };

  return (
    <>
      <PageHeader
        title="Services"
        subtitle={canEdit ? "The catalog customers can book, and its prices. Order totals always use these prices." : "The catalog customers can book, and its prices."}
      />

      <div className={canEdit ? "gh-split" : ""}>
        <section aria-label="Service catalog">
          {loading ? (
            <div className="d-grid gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="gh-skeleton" style={{ height: 76 }} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="gh-card gh-empty">
              <LuWrench aria-hidden="true" />
              <p>No services in the catalog yet.</p>
            </div>
          ) : (
            <ul className="gh-catalog gh-stagger">
              {services.map((service) => (
                <li key={service.service_id} className={`gh-catalog-item ${serviceToEdit?.service_id === service.service_id ? "is-editing" : ""}`}>
                  <div className="gh-catalog-main">
                    <div className="d-flex flex-wrap align-items-baseline gap-2">
                      <h2 className="h6 m-0 fw-semibold">{service.service_name}</h2>
                      <span className="gh-price">{formatPrice(service.service_price)}</span>
                    </div>
                    {service.service_description && <p className="gh-muted small m-0 mt-1">{service.service_description}</p>}
                  </div>
                  {canEdit && (
                    <div className="gh-row-actions">
                      <button type="button" className="gh-icon-btn" onClick={() => editService(service)} aria-label={`Edit ${service.service_name}`} title="Edit">
                        <LuSquarePen />
                      </button>
                      <button
                        type="button"
                        className="gh-icon-btn gh-icon-btn-danger"
                        onClick={() => deleteService(service)}
                        aria-label={`Delete ${service.service_name}`}
                        title="Delete"
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {canEdit && (
          <section id="service-form" className="gh-card gh-sticky" aria-labelledby="service-form-title">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 id="service-form-title" className="h5 m-0">
                {serviceToEdit ? "Update service" : "Add a new service"}
              </h2>
              {serviceToEdit && (
                <button type="button" className="gh-icon-btn" onClick={resetForm} aria-label="Cancel editing">
                  <LuX />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="service_name" className="form-label">
                  Name
                </label>
                <input
                  id="service_name"
                  type="text"
                  name="form_subject"
                  className="form-control"
                  placeholder="e.g. Brake fluid flush"
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="service_price" className="form-label">
                  Price ($)
                </label>
                <input
                  id="service_price"
                  type="number"
                  name="service_price"
                  className="form-control"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={newService.service_price}
                  onChange={(e) => setNewService({ ...newService, service_price: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="service_description" className="form-label">
                  Description
                </label>
                <textarea
                  id="service_description"
                  name="form_message"
                  className="form-control"
                  rows={3}
                  placeholder="What the service includes"
                  value={newService.service_description}
                  onChange={(e) => setNewService({ ...newService, service_description: e.target.value })}
                />
              </div>
              <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" type="submit">
                {serviceToEdit ? <LuSquarePen aria-hidden="true" /> : <LuPlus aria-hidden="true" />}
                {serviceToEdit ? "Update Service" : "Add Service"}
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}

export default ServicePage;
