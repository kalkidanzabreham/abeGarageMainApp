import { apiFetch } from "./api";

const addCustomers = async (formData) => {
  try {
    return await apiFetch("/customers", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  } catch (error) {
    console.log(error);
  }
};
const getCustomer = async () => {
  return apiFetch("/customers", { method: "GET" });
};
const singleCustomer = async (id) => {
  const response = await apiFetch(`/customers/${id}`, { method: "GET" });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to load customer");
  }
  return response;
};
const editCustomerInfo = async (id, data) => {
  try {
    const response = await apiFetch(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};
const customers = {
  addCustomers,
  getCustomer,
  singleCustomer,
  editCustomerInfo,
};

export default customers;
