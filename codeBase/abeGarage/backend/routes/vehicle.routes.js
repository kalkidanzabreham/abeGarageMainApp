const express = require("express");
const routes = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
routes.post("/api/addvehicle/:customer_id", authorize("vehicles:write"), vehicleController.addVehicle);
routes.get("/api/addvehicle/:customer_id", authorize("vehicles:read"), vehicleController.singelVehicleInfo);
routes.get("/api/getvehicle/:vehicle_id", authorize("vehicles:read"), vehicleController.eachVehicleInfo);
routes.put("/api/editvehicle/:vehicle_id", authorize("vehicles:write"), vehicleController.editVehicles);

module.exports = routes;
