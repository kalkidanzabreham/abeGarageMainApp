//import express from 'express';
const express = require('express');
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
// initalize express router
const router = express.Router();
// import the login controller
const loginController = require('../controllers/login.controller');
const { loginLimiter, demoLoginLimiter } = require('../middlewares/rateLimit.middleware');
const { DEMO_LOGIN_ENABLED } = require('../config/env');
// define the routes
router.post('/api/employee/login', loginLimiter, validate(schemas.login), loginController.login);
// (POST /api/guest-login was removed: it gave a valid token to anyone.)
// One-click demo login: Demo role only (read-only), opt-in, rate-limited.
if (DEMO_LOGIN_ENABLED) {
  router.post('/api/employee/demo-login', demoLoginLimiter, validate(schemas.none), loginController.demoLogin);
}

// export the router
module.exports = router;
