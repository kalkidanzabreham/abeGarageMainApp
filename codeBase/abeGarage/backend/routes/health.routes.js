const express = require("express");
const router = express.Router();
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const healthController = require("../controllers/health.controller");

// public: used by Docker / hosting health checks
router.get("/api/health", validate(schemas.none), healthController.health);

module.exports = router;
