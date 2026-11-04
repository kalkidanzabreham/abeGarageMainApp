// Smart job intake. Mounted only when AI_ENABLED=true (routes/index.js).
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const { authorize } = require("../middlewares/auth.middleware");
const { AppError } = require("../utils/AppError");
const env = require("../config/env");
const ai = require("../controllers/ai.controller");

const router = express.Router();

// per user (not per IP): AI_USER_LIMIT requests per AI_USER_WINDOW_MIN
const perUserLimit = rateLimit({
  windowMs: env.AI_USER_WINDOW_MIN * 60 * 1000,
  limit: env.AI_USER_LIMIT,
  keyGenerator: (req) => `employee:${req.user.employee_id}`,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new AppError(429, "AI_RATE_LIMITED", `You can use smart intake ${env.AI_USER_LIMIT} times per ${env.AI_USER_WINDOW_MIN} minutes. Please wait a little.`)),
});

router.get("/api/ai/status", authorize("ai:intake"), validate(schemas.none), ai.status);
router.post("/api/ai/intake", authorize("ai:intake"), perUserLimit, validate(schemas.aiIntake), ai.intake);

module.exports = router;
