const express = require("express");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const routes = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
routes.post("/api/addvehicle/:customer_id", authorize("vehicles:write"), validate(schemas.createVehicle), vehicleController.addVehicle);
routes.get("/api/addvehicle/:customer_id", authorize("vehicles:read"), validate(schemas.byCustomerId), vehicleController.singelVehicleInfo);
routes.get("/api/getvehicle/:vehicle_id", authorize("vehicles:read"), validate(schemas.byVehicleId), vehicleController.eachVehicleInfo);
routes.put("/api/editvehicle/:vehicle_id", authorize("vehicles:write"), validate(schemas.updateVehicle), vehicleController.editVehicles);

module.exports = routes;
