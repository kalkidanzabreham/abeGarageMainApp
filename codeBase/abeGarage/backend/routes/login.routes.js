//import express from 'express';
const express = require('express');
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
// initalize express router
const router = express.Router();
// import the login controller
const loginController = require('../controllers/login.controller');
// define the routes
router.post('/api/employee/login', validate(schemas.login), loginController.login);
// (POST /api/guest-login was removed: it gave a valid token to anyone.
// Use the seeded read-only demo account instead.)

// export the router
module.exports = router;
