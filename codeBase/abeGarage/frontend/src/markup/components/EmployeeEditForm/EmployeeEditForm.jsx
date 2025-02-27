import React, { useState, useEffect } from "react";
import {
  updateEmployee,
  getEmployee,
} from "../../../services/employee.service";
import { useAuth } from "../../../Context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

function EmployeeEditForm() {
  const { employee_id } = useParams();
  const navigate = useNavigate();
  const [getemployee, setgetEmployee] = useState(null);
  const [employeeValue, setEmployeeValue] = useState({
    employee_first_name: "",
    employee_last_name: "",
    employee_phone: "",
    company_role_id: "",
    active_employee: false,
  });

  const [apiError, setApiError] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const [serverError, setServerError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const { employee } = useAuth();
  const token = employee ? employee.token : null;


  // Fetch employee data when component loads
  useEffect(() => {
    // if (!token || !employee_id) return;

    const fetchEmployeeData = async () => {
      try {
        const res = await getEmployee(token, employee_id);
        if (!res.ok) {
          setApiError(true);
          setApiErrorMessage(
            res.status === 401
              ? "Please login again"
              : res.status === 403
              ? "You are not authorized to view this page"
              : "Error fetching data"
          );
          return;
        }

        const data = await res.json();
		console.log(data);
        if (data) {
          setgetEmployee(data);
          setEmployeeValue({
            employee_first_name: data.data.employee_first_name || "",
            employee_last_name: data.data.employee_last_name || "",
            employee_email : data.data.employee_email || "",
            employee_phone: data.data.employee_phone || "",
            company_role_id: data.data.company_role_id || "",
            active_employee: data.data.active_employee || false,
          });
        }
      } catch (err) {
        console.error(err);
        setApiError(true);
        setApiErrorMessage("Error loading employee data.");
      }
    };

    fetchEmployeeData();
  }, [token, employee_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await updateEmployee(employee_id, employeeValue, token);
      const data = await res.json();

      if (data.error) {
        setServerError(data.error);
      } else {
        setUpdateSuccess(true);
        setServerError("");
        setTimeout(() => navigate("/admin/employee"), 2000); // Redirect after 2 sec
      }
    } catch (err) {
      setServerError("Failed to update employee. Try again.");
    }
  };

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Edit: {employeeValue.employee_first_name}</h2>
          <h5>Employee email: {employeeValue.employee_email}</h5>
        </div>

        <div className="row clearfix">
          <div className="form-column col-lg-7">
            <div className="inner-column">
              <div className="contact-form">
                <form onSubmit={handleSubmit}>
                  <div className="row clearfix">
                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_first_name"
                        value={employeeValue.employee_first_name}
                        onChange={(e) =>
                          setEmployeeValue({
                            ...employeeValue,
                            employee_first_name: e.target.value,
                          })
                        }
                        placeholder="Employee first name"
                      />
                    </div>
                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_last_name"
                        value={employeeValue.employee_last_name}
                        onChange={(e) =>
                          setEmployeeValue({
                            ...employeeValue,
                            employee_last_name: e.target.value,
                          })
                        }
                        placeholder="Employee last name"
                      />
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_phone"
                        value={employeeValue.employee_phone}
                        onChange={(e) =>
                          setEmployeeValue({
                            ...employeeValue,
                            employee_phone: e.target.value,
                          })
                        }
                        placeholder="Employee phone"
                      />
                    </div>

                    <div className="form-group col-md-12">
                      <select
                        name="employee_role"
                        value={employeeValue.company_role_id}
                        onChange={(e) =>
                          setEmployeeValue({
                            ...employeeValue,
                            company_role_id: e.target.value,
                          })
                        }
                        className="custom-select-box"
                      >
                        <option value="1">Employee</option>
                        <option value="2">Manager</option>
                        <option value="3">Admin</option>
                      </select>
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="checkbox"
                        name="employeeStatus"
                        checked={employeeValue.active_employee}
                        onChange={(e) =>
                          setEmployeeValue({
                            ...employeeValue,
                            active_employee: e.target.checked,
                          })
                        }
                      />
                      <span>Is active employee</span>
                    </div>

                    <button className="theme-btn btn-style-one" type="submit">
                      Update
                    </button>

                    {updateSuccess && <p>Updated successfully!</p>}
                    {serverError && <p>{serverError}</p>}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeEditForm;
