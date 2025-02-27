const query = require("../config/db.config");

// Get all services
const getAllServices = async () => {
  const sql = "SELECT * FROM common_services";
  const result = await query(sql);
  return result;
};

// Add a new service
const addService = async (service) => {
  try {
    const sql =
      "INSERT INTO common_services (service_name, service_description) VALUES (?, ?)";
    const result = await query(sql, [service.service_name, service.service_description]);
    if (result.affectedRows !== 1) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// Update a service
const updateService = async (id, service) => {
  try {
    const sql =
      "UPDATE common_services SET service_name = ?, service_description = ? WHERE service_id = ?";
    const result = await query(sql, [service.service_name, service.service_description,id]);
    if (result.affectedRows !== 1) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// Delete a service
const deleteService = async (id) => {
  try {
    const sql = "DELETE FROM common_services WHERE service_id = ?";
    const result = await query(sql, [id]);
    if (result.affectedRows !== 1) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports = { getAllServices, addService, updateService, deleteService };
