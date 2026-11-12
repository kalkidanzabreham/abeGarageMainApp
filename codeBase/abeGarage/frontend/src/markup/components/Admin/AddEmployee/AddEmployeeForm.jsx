import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuUserCog } from "react-icons/lu";
import { createEmployee } from "../../../../services/employee.service";
import PageHeader from "../../ui/PageHeader";
import Field, { FormCard } from "../../ui/Field";
import PasswordInput from "../../ui/PasswordInput";
import { GearSpinner } from "../../ui/garage";

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

function AddEmployeeForm() {
  const [firstNameError, setFirstNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFirstNameError("");
    setEmailError("");
    setPasswordError("");
    setServerError("");

    // (the form data, password included, used to be logged to the console)
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.active_employee = 1;
    let valid = true;

    if (data.employee_first_name === "") {
      setFirstNameError("First name is required");
      valid = false;
    }
    if (data.employee_email === "") {
      setEmailError("Email is required");
      valid = false;
    } else if (!EMAIL_REGEX.test(data.employee_email)) {
      setEmailError("Email is invalid");
      valid = false;
    }
    if (data.employee_password === "") {
      setPasswordError("Password is required");
      valid = false;
    } else if (data.employee_password.length < 8) {
      // matches the API rule (validators/schemas.js)
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }
    if (!valid) return;

    setSaving(true);
    try {
      const response = await createEmployee(data);
      if (response.message) {
        setServerError(response.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/admin/employee"), 1500);
      }
    } catch (error) {
      console.error(error);
      setServerError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Add a new employee" subtitle="They log in with this email and password; the role decides what they can do." />
      <FormCard
        onSubmit={handleSubmit}
        className="gh-form-narrow"
        footer={
          <>
            <Link to="/admin/employee" className="btn btn-outline-secondary">
              Cancel
            </Link>
            <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="submit" disabled={saving || success}>
              {saving ? <GearSpinner /> : <LuUserCog aria-hidden="true" />}
              {saving ? "Saving..." : "Add employee"}
            </button>
          </>
        }
      >
        {serverError && (
          <div className="gh-alert gh-alert-danger gh-span-2" role="alert">
            {serverError}
          </div>
        )}
        {success && (
          <div className="gh-alert gh-alert-success gh-span-2" role="status">
            Employee added. Taking you to the list...
          </div>
        )}
        <Field label="First name" name="employee_first_name" error={firstNameError} autoComplete="off" />
        <Field label="Last name" name="employee_last_name" autoComplete="off" />
        <Field label="Email" name="employee_email" type="email" error={emailError} placeholder="name@garage.com" autoComplete="off" />
        <Field label="Phone" name="employee_phone" placeholder="555-555-5555" autoComplete="off" />
        <Field label="Role" name="company_role_id" as="select" defaultValue="1">
          <option value="1">Mechanic</option>
          <option value="2">Manager</option>
          <option value="3">Admin</option>
          <option value="4">Demo (read-only)</option>
        </Field>
        <div className="gh-field">
          <label htmlFor="employee_password" className="form-label">
            Password
          </label>
          <PasswordInput
            id="employee_password"
            name="employee_password"
            autoComplete="new-password"
            invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "employee_password-error" : "employee_password-hint"}
          />
          {passwordError ? (
            <div id="employee_password-error" className="gh-field-error" role="alert">
              {passwordError}
            </div>
          ) : (
            <div id="employee_password-hint" className="form-text">
              At least 8 characters.
            </div>
          )}
        </div>
      </FormCard>
    </>
  );
}

export default AddEmployeeForm;
