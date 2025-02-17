// import express 
const express = require('express');
// create a router
const router = express.Router();
// import the employee controller
const employeeController = require('../controllers/employee.controller');
// import middlewaare fuction to validate the employee data
const {verifyToken} = require("../middlewares/auth.middleware");
const {verifyAdmin }= require('../middlewares/auth.middleware');
// define the routes
router.post('/api/employee',[verifyToken,verifyAdmin],employeeController.addEmployee);
// create a get route to get all employees

router.get('/api/employee', [verifyToken, verifyAdmin], employeeController.getAllEmployees);
// export the router
module.exports = router;