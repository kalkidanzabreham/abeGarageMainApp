import { apiFetch } from "./api";

const getAllServices = async () => {
  try {
    const response = await apiFetch("/services", { method: "GET" });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const addServiceService = async (service) => {
  try {
    const response = await apiFetch("/services", {
      method: "POST",
      body: JSON.stringify(service),
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const updateServiceService = async (service, serviceToBeEdited) => {
  try {
    const response = await apiFetch(`/services/${serviceToBeEdited.service_id}`, {
      method: "PUT",
      body: JSON.stringify(service),
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const deleteServiceService = async (id) => {
  try {
    const response = await apiFetch(`/services/${id}`, { method: "DELETE" });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export { getAllServices, addServiceService, updateServiceService, deleteServiceService };
