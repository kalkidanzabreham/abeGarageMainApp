// a route to define the order routes
const express = require("express");
const router = express.Router();
// import the controller
const orderController = require("../controllers/order.controller");
// import authMiddleware
const authMiddleware = require("../middlewares/auth.middleware");

// create a route to handle the add order request on post
router.post(
  "/api/order",
  [authMiddleware.verifyToken, authMiddleware.verifyAdmin],
  orderController.addOrder
);
// create a get request to update the order
router.put(
  "/api/order/:id",
  [authMiddleware.verifyToken, authMiddleware.verifyAdmin],
  orderController.updateOrder
);
// create a get request to get all orders
router.get(
  "/api/orders",
  [authMiddleware.verifyToken, authMiddleware.verifyAdmin],
  orderController.getAllOrders
);
// create a get request to get a single order by id
router.get(
  "/api/order/:id",
  [authMiddleware.verifyToken, authMiddleware.verifyAdmin],
  orderController.getOrderById
);
router.get(
  "/api/singleorder_per_customer/:id",
 orderController.getsinglecustomersOrder
);
router.get("/api/singleorder/:id", orderController.getsingleOrder);

// export the router
module.exports = router;
