// a route to define the order routes
const express = require("express");
const router = express.Router();
// import the controller
const orderController = require("../controllers/order.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
// (the public tracking link GET /api/order/hash/:hash is in tracking.routes.js)
router.post("/api/order", authorize("orders:create"), orderController.addOrder);

router.put("/api/order/:id", authorize("orders:update"), orderController.updateOrder);

router.get("/api/orders", authorize("orders:read"), orderController.getAllOrders);

router.get("/api/order/:id", authorize("orders:read"), orderController.getOrderById);

router.get(
  "/api/singleorder_per_customer/:id",
  authorize("orders:read"),
  orderController.getsinglecustomersOrder
);

router.get("/api/singleorder/:id", authorize("orders:read"), orderController.getsingleOrder);

// export the router
module.exports = router;
