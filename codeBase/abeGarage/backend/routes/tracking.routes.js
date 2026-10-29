// Public, unauthenticated: the read-only link a customer receives to track
// their order. The hash is a random UUID v4, so it cannot be guessed.
const express = require("express");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const router = express.Router();
const orderController = require("../controllers/order.controller");

router.get("/api/order/hash/:hash", validate(schemas.byHash), orderController.getOrderByHash);

module.exports = router;
