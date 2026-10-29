const vehicleService = require("../services/vehicle.service");
const { notFound } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");

// Errors are thrown and handled by middlewares/error.middleware.js

const addVehicle = async (req, res) => {
  const { customer_id } = req.params; // Get customer_id from URL params
  const result = await vehicleService.addVehicleForCustomer(
    customer_id,
    req.body
  );
  res.status(201).json({
    message: "Vehicle added successfully",
    // was the whole mysql result packet; the id is what callers need
    vehicle_id: result.insertId,
  });
};

const singelVehicleInfo = async (req, res) => {
  const { customer_id } = req.params;
  const vehicles = await vehicleService.customerVehicle(customer_id);
  return res.status(200).json({
    data: vehicles,
  });
};

const eachVehicleInfo = async (req, res) => {
  const { vehicle_id } = req.params;
  const vehicle = await vehicleService.singleVehicle(vehicle_id);
  if (vehicle.length === 0) {
    throw notFound("Vehicle not found");
  }
  return res.status(200).json({
    data: vehicle,
  });
};

const editVehicles = async (req, res) => {
  const { vehicle_id } = req.params;
  const vehicle = await vehicleService.editVehicleInfo(vehicle_id, req.body);
  if (vehicle.affectedRows === 0) {
    throw notFound("Vehicle not found");
  }
  return res.status(200).json({
    message: "Vehicle edited successfully",
    data: vehicle,
  });
};

module.exports = wrapAll({
  addVehicle,
  singelVehicleInfo,
  eachVehicleInfo,
  editVehicles,
});
