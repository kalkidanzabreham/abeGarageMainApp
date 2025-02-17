import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import { format } from "date-fns";
import { getAllEmployees } from "../../../services/employee.service";
function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  // a state to hold api erro
  const [apiError, setApiError] = useState(false);
  // a state to hold api error message
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  // fetch employees from the api
  const { token } = useAuth();
  useEffect(() => {
    const allEmployees = getAllEmployees(token);
    allEmployees.then((response) => {
    //   console.log(!response.success );
      if (!response.success) {
        setApiError(true);
        if (response.status === 401) {
          setApiErrorMessage("Unauthorized. Please login again.");
        } else if (response.status == 403) {
          setApiErrorMessage("Access denied. You are not an admin.");
        } else {
          setApiErrorMessage("something went wrong");
        }
      } else {
        console.log(response.data);

        setEmployees(response.data);
      }
    });
  }, []);
  console.log(employees);

  return (
    <>
      {apiError ? (
        <section className="contact-section">
          <div className="auto-container">
            <div className="contact-title">
              <h2>{apiErrorMessage}</h2>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="contact-section">
            <div className="auto-container">
              <div className="contact-title">
                <h2>Employees</h2>
              </div>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Active</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Added Date</th>
                    <th>Role</th>
                    <th>Edit/Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_id}>
                      <td>{employee.active_employee ? "Yes" : "No"}</td>
                      <td>{employee.employee_first_name}</td>
                      <td>{employee.employee_last_name}</td>
                      <td>{employee.employee_email}</td>
                      <td>{employee.employee_phone}</td>
                      <td>
                        {format(
                          new Date(employee.added_date),
                          "MM - dd - yyyy | kk:mm"
                        )}
                      </td>
                      <td>{employee.company_role_name}</td>
                      <td>
                        <div className="edit-delete-icons">edit | delete</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default EmployeeList;
