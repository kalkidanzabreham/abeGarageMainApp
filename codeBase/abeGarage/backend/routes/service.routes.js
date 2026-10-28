const express = require("express");
// create a router
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
router.post("/api/services", authorize("services:write"), serviceController.addService);

router.put("/api/services/:id", authorize("services:write"), serviceController.updateService);

router.get("/api/services", authorize("services:read"), serviceController.getAllServices);

router.delete("/api/services/:id", authorize("services:write"), serviceController.deleteService);

// export the router
module.exports = router;
