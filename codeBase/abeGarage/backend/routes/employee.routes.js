// import express
const express = require('express');
// create a router
const router = express.Router();
// import the employee controller
const employeeController = require('../controllers/employee.controller');
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
router.post('/api/employee', authorize("employees:write"), employeeController.addEmployee);

router.get('/api/employee', authorize("employees:read"), employeeController.getAllEmployees);

router.get("/api/employee/:id", authorize("employees:read"), employeeController.getSingleEmployee);

router.put("/api/employee/:id", authorize("employees:write"), employeeController.updateEmployee);

router.delete("/api/employee/:id", authorize("employees:write"), employeeController.deleteEmployee);

// export the router
module.exports = router;
