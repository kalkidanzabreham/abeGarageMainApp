import { apiFetch } from "./api";

const addVehicles = async (customer_id, vehicleData) => {
  return apiFetch(`/addvehicle/${customer_id}`, {
    method: "POST",
    body: JSON.stringify(vehicleData),
  });
};
const CustomerVehicle = async (customer_id) => {
  try {
    const response = await apiFetch(`/addvehicle/${customer_id}`, { method: "GET" });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};
const singleVehicle = async (vehicle_id) => {
  try {
    const response = await apiFetch(`/getvehicle/${vehicle_id}`, { method: "GET" });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};

const editVehicle = async (vehicle_id, data) => {
  try {
    // (the old URL had a stray space: "/editvehicle/ 12")
    return await apiFetch(`/editvehicle/${vehicle_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.log(error);
  }
};
const vehicles = {
  addVehicles,
  CustomerVehicle,
  singleVehicle,
  editVehicle,
};

export default vehicles;
