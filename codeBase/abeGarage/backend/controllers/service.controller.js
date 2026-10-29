const serviceService = require("../services/service.service");
const { notFound } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");

// Errors are thrown and handled by middlewares/error.middleware.js

// Add a new service
const addService = async (req, res) => {
  await serviceService.addService(req.body);
  return res.status(200).json({
    success: "true",
  });
};

// Get all services
const getAllServices = async (req, res) => {
  const services = await serviceService.getAllServices();
  return res.status(200).json({
    success: "true",
    data: services,
  });
};

// Update a service
const updateService = async (req, res) => {
  const serviceUpdated = await serviceService.updateService(
    req.params.id,
    req.body
  );
  if (!serviceUpdated) {
    throw notFound("Service not found");
  }
  return res.status(200).json({
    success: "true",
    message: "Service updated successfully",
  });
};

// Delete a service
const deleteService = async (req, res) => {
  const serviceDeleted = await serviceService.deleteService(req.params.id);
  if (!serviceDeleted) {
    throw notFound("Service not found");
  }
  return res.status(200).json({
    success: "true",
    message: "Service deleted successfully",
  });
};

module.exports = wrapAll({
  addService,
  getAllServices,
  updateService,
  deleteService,
});
