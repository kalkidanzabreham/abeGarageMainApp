import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { LuContact, LuSquarePen, LuTrash2, LuUserCog } from "react-icons/lu";
import { useAuth } from "../../../Context/AuthContext";
import { getAllEmployees, deleteEmployee } from "../../../services/employee.service";
import PageHeader from "../ui/PageHeader";
import Pager from "../ui/Pager";

const PAGE_SIZE = 10;

const ROLE_PILL = { Admin: "gh-pill-amber", Manager: "gh-pill-blue", Mechanic: "gh-pill-green" };

function EmployeeList() {
  const navigate = useNavigate();
  const { isDemo, can } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  // admins manage staff; Demo sees the buttons so it gets the friendly
  // "the demo account cannot..." message instead of a silent 403
  const showActions = can("employees:write") || isDemo;

  useEffect(() => {
    let cancelled = false;
    const fetchEmployees = async () => {
      setLoading(true);
      // paginated on the server (the API used to cap this list at 10)
      const response = await getAllEmployees({ page, page_size: PAGE_SIZE });
      if (cancelled) return;
      if (!response.success) {
        setApiErrorMessage(response.status === 401 ? "Please log in again." : "Couldn't load employees. Please try again later.");
      } else {
        setEmployees(response.data);
        setTotalPages(response.pagination.total_pages);
      }
      setLoading(false);
    };
    fetchEmployees();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleDelete = async (employee) => {
    if (isDemo) {
      Swal.fire("Access Denied", "The demo account cannot delete employees.", "warning");
      return;
    }
    const result = await Swal.fire({
      title: `Delete ${employee.employee_first_name} ${employee.employee_last_name}?`,
      text: "Their account will be removed. This can't be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const response = await deleteEmployee(employee.employee_id);
    if (response.success) {
      setEmployees((list) => list.filter((emp) => emp.employee_id !== employee.employee_id));
      Swal.fire("Deleted", "The employee has been removed.", "success");
    } else {
      Swal.fire("Error", "Failed to delete employee.", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Staff accounts and what each role can do."
        actions={
          can("employees:write") && (
            <Link to="/admin/add-employee" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <LuUserCog aria-hidden="true" /> Add employee
            </Link>
          )
        }
      />

      {apiErrorMessage ? (
        <div className="gh-alert gh-alert-danger" role="alert">
          {apiErrorMessage}
        </div>
      ) : (
        <>
          <div className="gh-table-wrap">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col">Added</th>
                    <th scope="col">Status</th>
                    {showActions && (
                      <th scope="col" className="text-end">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className={loading ? "gh-loading-rows" : ""}>
                  {employees.map((employee) => (
                    <tr key={employee.employee_id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="gh-avatar gh-avatar-sm" aria-hidden="true">
                            {`${employee.employee_first_name?.[0] ?? ""}${employee.employee_last_name?.[0] ?? ""}`.toUpperCase()}
                          </span>
                          <div>
                            <div className="fw-semibold">
                              {employee.employee_first_name} {employee.employee_last_name}
                            </div>
                            <div className="gh-muted small">{employee.employee_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">{employee.employee_phone}</td>
                      <td>
                        <span className={`gh-pill ${ROLE_PILL[employee.company_role_name] || ""}`}>{employee.company_role_name}</span>
                      </td>
                      <td className="text-nowrap gh-muted">{format(new Date(employee.added_date), "d MMM yyyy")}</td>
                      <td>
                        {employee.active_employee ? <span className="gh-pill gh-pill-green">Active</span> : <span className="gh-pill">Inactive</span>}
                      </td>
                      {showActions && (
                        <td>
                          <div className="gh-row-actions">
                            <button
                              type="button"
                              className="gh-icon-btn"
                              onClick={() => navigate(`/admin/employees/edit/${employee.employee_id}`)}
                              aria-label={`Edit ${employee.employee_first_name} ${employee.employee_last_name}`}
                              title="Edit"
                            >
                              <LuSquarePen />
                            </button>
                            <button
                              type="button"
                              className="gh-icon-btn gh-icon-btn-danger"
                              onClick={() => handleDelete(employee)}
                              aria-label={`Delete ${employee.employee_first_name} ${employee.employee_last_name}`}
                              title="Delete"
                            >
                              <LuTrash2 />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && employees.length === 0 && (
              <div className="gh-empty">
                <LuContact aria-hidden="true" />
                <p>No employees yet.</p>
              </div>
            )}
          </div>
          <Pager currentPage={page} totalPages={totalPages} setCurrentPage={setPage} />
        </>
      )}
    </>
  );
}

export default EmployeeList;
