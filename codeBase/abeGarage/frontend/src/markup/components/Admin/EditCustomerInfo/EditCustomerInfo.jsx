import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { LuSave } from "react-icons/lu";
import customerService from "../../../../services/customer.service";
import { useAuth } from "../../../../Context/AuthContext";
import PageHeader from "../../ui/PageHeader";
import Field, { FormCard } from "../../ui/Field";
import { GearSpinner } from "../../ui/garage";

function EditCustomersInfo() {
  const { customer_id } = useParams();
  const navigate = useNavigate();
  const { can, isDemo } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [customer_first_name, setFirstName] = useState("");
  const [customer_last_name, setLastName] = useState("");
  const [customer_phone_number, setPhoneNumber] = useState("");
  const [active_customer_status, setActive] = useState(1);

  // load the customer directly (this used to render a hidden SingleCustomer
  // component just to fetch the data)
  useEffect(() => {
    let cancelled = false;
    customerService
      .singleCustomer(customer_id)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        const c = body.data?.[0];
        if (!c) return setLoadError("Customer not found.");
        setCustomer(c);
        setFirstName(c.customer_first_name || "");
        setLastName(c.customer_last_name || "");
        setPhoneNumber(c.customer_phone_number || "");
        setActive(c.active_customer_status ? 1 : 0);
      })
      .catch((err) => !cancelled && setLoadError(err.message || "Couldn't load the customer."));
    return () => {
      cancelled = true;
    };
  }, [customer_id]);

  const handleForm = async (e) => {
    e.preventDefault();
    if (isDemo) {
      Swal.fire("Access Denied", "The demo account cannot edit customers.", "warning");
      return;
    }
    if (!can("customers:write")) {
      toast.error("You don't have permission to edit customers");
      return;
    }
    setSaving(true);
    try {
      const result = await customerService.editCustomerInfo(customer_id, {
        customer_first_name,
        customer_last_name,
        customer_phone_number,
        active_customer_status,
      });
      if (result.status === "error") {
        setServerError(result.message);
        return;
      }
      setServerError("");
      toast.success("Customer updated");
      navigate(-1);
    } catch (error) {
      setServerError(error.message || "Couldn't save the changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="gh-alert gh-alert-danger" role="alert">
        {loadError}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Edit customer"
        title={customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : "Loading..."}
        subtitle={customer?.customer_email ? `Email: ${customer.customer_email} (can't be changed here)` : undefined}
      />
      {!customer ? (
        <div className="gh-skeleton" style={{ height: 260, maxWidth: 760 }} />
      ) : (
        <FormCard
          onSubmit={handleForm}
          className="gh-form-narrow"
          footer={
            <>
              <Link to={`/admin/customer_profile/${customer_id}`} className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="submit" disabled={saving}>
                {saving ? <GearSpinner /> : <LuSave aria-hidden="true" />}
                {saving ? "Saving..." : "Update"}
              </button>
            </>
          }
        >
          {serverError && (
            <div className="gh-alert gh-alert-danger gh-span-2" role="alert">
              {serverError}
            </div>
          )}
          <Field label="First name" name="customer_first_name" value={customer_first_name} onChange={(e) => setFirstName(e.target.value)} />
          <Field label="Last name" name="customer_last_name" value={customer_last_name} onChange={(e) => setLastName(e.target.value)} />
          <Field label="Phone" name="customer_phone" value={customer_phone_number} onChange={(e) => setPhoneNumber(e.target.value)} />
          <div className="gh-field gh-field-switch">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="active_customer"
                name="active_customer"
                checked={active_customer_status === 1}
                onChange={(e) => setActive(e.target.checked ? 1 : 0)}
              />
              <label className="form-check-label" htmlFor="active_customer">
                Active customer
              </label>
            </div>
          </div>
        </FormCard>
      )}
    </>
  );
}

export default EditCustomersInfo;
