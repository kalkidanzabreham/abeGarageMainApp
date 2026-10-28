// Public, unauthenticated: the read-only link a customer receives to track
// their order. The hash is a random UUID v4, so it cannot be guessed.
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");

router.get("/api/order/hash/:hash", orderController.getOrderByHash);

module.exports = router;
