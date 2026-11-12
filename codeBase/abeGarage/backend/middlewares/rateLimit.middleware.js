const { rateLimit } = require("express-rate-limit");
const { LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_MIN, DEMO_LOGIN_RATE_LIMIT } = require("../config/env");
const { AppError } = require("../utils/AppError");

// Brute-force protection for POST /api/employee/login: at most
// LOGIN_RATE_LIMIT_MAX failed attempts per IP per window (default 10 per
// 15 minutes). Successful logins don't count, so a user who mistypes once
// isn't locked out. Behind a proxy, set TRUST_PROXY so the limit applies to
// the real client IP. In-memory store: fine for one instance; several
// instances would need a shared store (e.g. Redis).
const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  limit: LOGIN_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new AppError(429, "RATE_LIMITED", "Too many failed login attempts. Try again later.")),
});

// POST /api/employee/demo-login: every request counts (they all succeed),
// DEMO_LOGIN_RATE_LIMIT per IP per 15 minutes.
const demoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: DEMO_LOGIN_RATE_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new AppError(429, "RATE_LIMITED", "Too many demo logins from this address. Try again later.")),
});

module.exports = { loginLimiter, demoLoginLimiter };
