const serviceService = require("../services/service.service");

// Add a new service
const addService = async (req, res) => {
  try {
    const serviceAdded = await serviceService.addService(req.body);
    if (serviceAdded) {
      return res.status(200).json({
        success: "true",
      });
    } else {
      return res.status(400).json({
        message: "Error adding service",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    if (services) {
      return res.status(200).json({
        success: "true",
        data: services,
      });
    } else {
      return res.status(404).json({
        message: "No services found",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const serviceUpdated = await serviceService.updateService(
      req.params.id,
      req.body
    );
    if (serviceUpdated) {
      return res.status(200).json({
        success: "true",
        message: "Service updated successfully",
      });
    } else {
      return res.status(400).json({
        message: "Error updating service",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const serviceDeleted = await serviceService.deleteService(req.params.id);
    if (serviceDeleted) {
      return res.status(200).json({
        success: "true",
        message: "Service deleted successfully",
      });
    } else {
      return res.status(400).json({
        message: "Error deleting service",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  addService,
  getAllServices,
  updateService,
  deleteService,
};
