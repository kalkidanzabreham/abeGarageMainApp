import React, { useState } from "react";
// impoer customer service
import customers from '../../../../services/customer.service'
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { LuUserPlus } from "react-icons/lu";
import PageHeader from "../../ui/PageHeader";
import Field, { FormCard } from "../../ui/Field";
import { GearSpinner } from "../../ui/garage";
import { useAuth } from "../../../../Context/AuthContext";
import Swal from "sweetalert2";

function AddCustomer() {
  const [customer_email, setEmail] = useState("");
  const [customer_first_name, setFirstName] = useState("");
  const [customer_last_name, setLastName] = useState("");
  const [customer_phone_number, setPhoneNumber] = useState("");
  const [active_customer_status, setActive_customer] = useState(1);
  const [loading, setLoading] = useState(false);
  const { can, isDemo } = useAuth();
  const navigate = useNavigate();

  // Errors
  const [emailError, setEmailError] = useState("");
  const [firstNameRequired, setFirstNameRequired] = useState("");
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
     if (isDemo) {
          Swal.fire("Access Denied", "The demo account cannot add customers.", "warning");
          return;
        }
    if (!can("customers:write")) {
      toast.error("Unauthorized Access");
      return;
    }
    setLoading(true);
    let valid = true;

    if (!customer_first_name) {
      setFirstNameRequired("First name is required");
      valid = false;
    } else {
      setFirstNameRequired("");
    }

    if (!customer_email) {
      setEmailError("Email is required");
      valid = false;
    } else {
      const regex = /^\S+@\S+\.\S+$/;
      if (!regex.test(customer_email)) {
        setEmailError("Invalid email format");
        valid = false;
      } else {
        setEmailError("");
      }
    }

    if (!valid) {
      setLoading(false);
      return;
    }

    const formData = {
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone_number,
      active_customer_status,
    };

    try {
      const response = await customers.addCustomers(formData);
      const data = await response.json();

      if (data.status === "error") {
        return setServerError(data.message);
      }
      setSuccess(true);
      setServerError("");
      toast.success(data.message);
      navigate("/admin/all_customers");
    } catch (error) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      setServerError(resMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Add a new customer" subtitle="Vehicles and orders can be added from the customer's profile." />
      <FormCard
        onSubmit={handleSubmit}
        className="gh-form-narrow"
        footer={
          <>
            <Link to="/admin/all_customers" className="btn btn-outline-secondary">
              Cancel
            </Link>
            <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="submit" disabled={loading}>
              {loading ? <GearSpinner /> : <LuUserPlus aria-hidden="true" />}
              {loading ? "Saving..." : "Add Customer"}
            </button>
          </>
        }
      >
        {serverError && (
          <div className="gh-alert gh-alert-danger gh-span-2" role="alert">
            {serverError}
          </div>
        )}
        <Field
          label="First name"
          name="customer_first_name"
          value={customer_first_name}
          onChange={(event) => setFirstName(event.target.value)}
          error={firstNameRequired}
          autoComplete="off"
        />
        <Field
          label="Last name"
          name="customer_last_name"
          value={customer_last_name}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete="off"
        />
        <Field
          label="Email"
          type="email"
          name="customer_email"
          value={customer_email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          placeholder="name@example.com"
          autoComplete="off"
        />
        <Field
          label="Phone"
          name="customer_phone"
          value={customer_phone_number}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="555-555-5555"
          autoComplete="off"
        />
      </FormCard>
    </>
  );
}

export default AddCustomer;
