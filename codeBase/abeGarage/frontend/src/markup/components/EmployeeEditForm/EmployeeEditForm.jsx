import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { LuSave } from "react-icons/lu";
import { updateEmployee, getEmployee } from "../../../services/employee.service";
import { useAuth } from "../../../Context/AuthContext";
import PageHeader from "../ui/PageHeader";
import Field, { FormCard } from "../ui/Field";
import { GearSpinner } from "../ui/garage";

function EmployeeEditForm() {
  const { employee_id } = useParams();
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [employeeValue, setEmployeeValue] = useState({
    employee_first_name: "",
    employee_last_name: "",
    employee_email: "",
    employee_phone: "",
    company_role_id: "",
    active_employee: false,
  });
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const res = await getEmployee(employee_id);
        if (!res.ok) {
          setApiErrorMessage(
            res.status === 401 ? "Please log in again." : res.status === 403 ? "You are not authorized to view this page." : "Error fetching data."
          );
          return;
        }
        const { data } = await res.json();
        setEmployeeValue({
          employee_first_name: data.employee_first_name || "",
          employee_last_name: data.employee_last_name || "",
          employee_email: data.employee_email || "",
          employee_phone: data.employee_phone || "",
          company_role_id: data.company_role_id || "",
          active_employee: data.active_employee || false,
        });
        setLoaded(true);
      } catch (err) {
        console.error(err);
        setApiErrorMessage("Error loading employee data.");
      }
    };
    fetchEmployeeData();
  }, [employee_id]);

  const set = (key) => (e) => setEmployeeValue({ ...employeeValue, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      Swal.fire("Access Denied", "The demo account cannot edit employees.", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await updateEmployee(employee_id, employeeValue);
      const data = await res.json();
      if (data.status === "error") {
        setServerError(data.message);
      } else {
        setUpdateSuccess(true);
        setServerError("");
        setTimeout(() => navigate("/admin/employee"), 1500);
      }
    } catch {
      setServerError("Failed to update employee. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (apiErrorMessage) {
    return (
      <div className="gh-alert gh-alert-danger" role="alert">
        {apiErrorMessage}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Edit employee"
        title={loaded ? `${employeeValue.employee_first_name} ${employeeValue.employee_last_name}` : "Loading..."}
        subtitle={employeeValue.employee_email ? `Logs in as ${employeeValue.employee_email}` : undefined}
      />
      {!loaded ? (
        <div className="gh-skeleton" style={{ height: 300, maxWidth: 760 }} />
      ) : (
        <FormCard
          onSubmit={handleSubmit}
          className="gh-form-narrow"
          footer={
            <>
              <Link to="/admin/employee" className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="submit" disabled={saving || updateSuccess}>
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
          {updateSuccess && (
            <div className="gh-alert gh-alert-success gh-span-2" role="status">
              Employee updated. Taking you to the list...
            </div>
          )}
          <Field label="First name" name="employee_first_name" value={employeeValue.employee_first_name} onChange={set("employee_first_name")} />
          <Field label="Last name" name="employee_last_name" value={employeeValue.employee_last_name} onChange={set("employee_last_name")} />
          <Field label="Phone" name="employee_phone" value={employeeValue.employee_phone} onChange={set("employee_phone")} />
          <Field label="Role" name="employee_role" as="select" value={employeeValue.company_role_id} onChange={set("company_role_id")}>
            <option value="1">Mechanic</option>
            <option value="2">Manager</option>
            <option value="3">Admin</option>
            <option value="4">Demo (read-only)</option>
          </Field>
          <div className="gh-field gh-field-switch">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="employeeStatus"
                name="employeeStatus"
                checked={Boolean(employeeValue.active_employee)}
                onChange={(e) => setEmployeeValue({ ...employeeValue, active_employee: e.target.checked ? 1 : 0 })}
              />
              <label className="form-check-label" htmlFor="employeeStatus">
                Active employee (can log in)
              </label>
            </div>
          </div>
        </FormCard>
      )}
    </>
  );
}

export default EmployeeEditForm;
