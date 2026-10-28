const express = require("express");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
// create a router
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
router.post("/api/services", authorize("services:write"), validate(schemas.createService), serviceController.addService);

router.put("/api/services/:id", authorize("services:write"), validate(schemas.updateService), serviceController.updateService);

router.get("/api/services", authorize("services:read"), validate(schemas.none), serviceController.getAllServices);

router.delete("/api/services/:id", authorize("services:write"), validate(schemas.byId), serviceController.deleteService);

// export the router
module.exports = router;
