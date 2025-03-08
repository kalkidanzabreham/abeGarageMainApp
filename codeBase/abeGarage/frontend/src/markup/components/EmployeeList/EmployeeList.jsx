
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import { format } from "date-fns";
import { getAllEmployees,deleteEmployee } from "../../../services/employee.service";
import {useNavigate} from 'react-router-dom'

// Import the Font Awesome icons
import { FaEdit, FaTrash } from "react-icons/fa"; // Font Awesome icons
function EmployeeList() {
  const navigate = useNavigate();

  const handleEdit = (employee_id) => {
    navigate(`/admin/employees/edit/${employee_id}`); // Navigate to the edit form with the ID
  };
  const [employees, setEmployees] = useState([]);
  // a state to hold api erro
  const [apiError, setApiError] = useState(false);
  // a state to hold api error message
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  // fetch employees from the api
  const { token } = useAuth();
 useEffect(() => {
   const fetchEmployees = async () => {
     const response = await getAllEmployees(token);
     if (!response.success) {
       setApiError(true);
       setApiErrorMessage(
         response.status === 401
           ? "Unauthorized. Please login again."
           : "Something went wrong"
       );
     } else {
       setEmployees(response.data);
     }
   };
   fetchEmployees();
 }, [token]);

const handleDelete = async (employee_id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "red",
    cancelButtonColor: "#1E2331",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  const response = await deleteEmployee(employee_id, token);
  if (response.success) {
    setEmployees(employees.filter((emp) => emp.employee_id !== employee_id));
    Swal.fire("Deleted!", "The employee has been removed From the database.", "success");
  } else {
    Swal.fire("Error!", "Failed to delete employee.", "error");
  }
};


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
              <Table
                striped
                bordered
                hover
                className="table-responsive-mobile "
              >
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
                        <div className="edit-delete-icons">
                          <FaEdit
                            className="edit-icon "
                            onClick={() => handleEdit(employee.employee_id)} // Trigger edit on click
                            aria-label="Edit"
                          />
                          <span> </span>
                          <FaTrash
                            className="delete-icon"
                            onClick={() => handleDelete(employee.employee_id)}
                            aria-label="Delete"
                          />
                        </div>
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
