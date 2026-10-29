// a route to define the order routes
const express = require("express");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const router = express.Router();
// import the controller
const orderController = require("../controllers/order.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
// (the public tracking link GET /api/order/hash/:hash is in tracking.routes.js)
router.post("/api/order", authorize("orders:create"), validate(schemas.createOrder), orderController.addOrder);

router.put("/api/order/:id", authorize("orders:update"), validate(schemas.updateOrder), orderController.updateOrder);

router.get("/api/orders", authorize("orders:read"), validate(schemas.listOrders), orderController.getAllOrders);

router.get("/api/order/:id", authorize("orders:read"), validate(schemas.byId), orderController.getOrderById);

router.get(
  "/api/singleorder_per_customer/:id",
  authorize("orders:read"),
  validate(schemas.byId),
  orderController.getsinglecustomersOrder
);

router.get("/api/singleorder/:id", authorize("orders:read"), validate(schemas.byId), orderController.getsingleOrder);

// export the router
module.exports = router;
