//import express from 'express';
const express = require('express');
// initalize express router
const router = express.Router();
// import the login controller
const loginController = require('../controllers/login.controller');
// define the routes
router.post('/api/employee/login', loginController.login); 

// export the router
module.exports = router;