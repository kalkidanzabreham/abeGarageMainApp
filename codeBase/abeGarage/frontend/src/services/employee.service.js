import { apiFetch, withQuery } from "./api";

// Callers still pass a token argument; it is ignored because apiFetch
// adds the stored token itself.
const createEmployee = async (data) => {
  try {
    const response = await apiFetch("/employee", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

// params: { page, page_size, q, role, active } (paginated on the server)
const getAllEmployees = async (params) => {
  const response = await apiFetch(withQuery("/employee", params), { method: "GET" });
  return response.json();
};

// A function to send get request to get employee
const getEmployee = async (employee_id) => {
  try {
    return await apiFetch(`/employee/${employee_id}`, { method: "GET" });
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
};

// Afunction to send put request to update employee data
const updateEmployee = async (employeeId, formData) => {
  return apiFetch(`/employee/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(formData),
  });
};

const deleteEmployee = async (employee_id) => {
  try {
    const response = await apiFetch(`/employee/${employee_id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.message || "Failed to delete employee" };
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export { createEmployee, getAllEmployees, getEmployee, updateEmployee, deleteEmployee };
