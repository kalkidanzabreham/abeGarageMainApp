const express = require("express");
// create a router
const router = express.Router();
// import the employee controller
const serviceController = require("../controllers/service.controller")
// import middlewaare fuction to validate the employee data
const { verifyToken } = require("../middlewares/auth.middleware");
const { verifyAdmin } = require("../middlewares/auth.middleware");
// define the routes
router.post(
  "/api/services",[verifyAdmin],
  serviceController.addService
);
router.put(
  "/api/services/:id",[verifyAdmin],
  serviceController.updateService
);

router.get(
  "/api/services",
  serviceController.getAllServices
);
router.delete(
  "/api/services/:id",[verifyAdmin],
  serviceController.deleteService
);
// export the router
module.exports = router;
