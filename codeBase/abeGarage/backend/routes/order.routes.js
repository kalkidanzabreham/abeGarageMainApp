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
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  orderController.addOrder
);
// create a get request to update the order
router.put(
  "/api/order/:id",
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  orderController.updateOrder
);
// create a get request to get all orders
router.get(
  "/api/orders",
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  orderController.getAllOrders
);
// create a get request to get a single order by id
router.get(
  "/api/order/:id",
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  orderController.getOrderById
);

// export the router
module.exports = router;
