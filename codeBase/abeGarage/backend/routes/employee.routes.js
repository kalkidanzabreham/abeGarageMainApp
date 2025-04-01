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
router.post('/api/employee',[verifyAdmin],employeeController.addEmployee);
// create a get route to get all employees

router.get('/api/employee', employeeController.getAllEmployees);

// Create a route to handle the get single employee request on get
router.get(
	"/api/employee/:id",
	
	employeeController.getSingleEmployee
);

// Updateroutes for employee
router.put(
	"/api/employee/:id",
	[verifyToken,verifyAdmin],
	employeeController.updateEmployee
);
router.delete(
  "/api/employee/:id",
  [verifyToken, verifyAdmin],
  employeeController.deleteEmployee
);


// export the router
module.exports = router;