const query = require("../config/db.config");

// Get all services
const getAllServices = async () => {
  const sql = "SELECT * FROM common_services";
  const result = await query(sql);
  return result;
};

// Add a new service
const addService = async (service) => {
  const sql =
    "INSERT INTO common_services (service_name, service_description, service_price) VALUES (?, ?, ?)";
  const result = await query(sql, [service.service_name, service.service_description, service.service_price]);
  if (result.affectedRows !== 1) {
    return false;
  }
  return true;
};

// Update a service
const updateService = async (id, service) => {
  const sql =
    "UPDATE common_services SET service_name = ?, service_description = ?, service_price = ? WHERE service_id = ?";
  const result = await query(sql, [service.service_name, service.service_description, service.service_price, id]);
  if (result.affectedRows !== 1) {
    return false;
  }
  return true;
};

// Delete a service
const deleteService = async (id) => {
  const sql = "DELETE FROM common_services WHERE service_id = ?";
  const result = await query(sql, [id]);
  if (result.affectedRows !== 1) {
    return false;
  }
  return true;
};

module.exports = { getAllServices, addService, updateService, deleteService };
