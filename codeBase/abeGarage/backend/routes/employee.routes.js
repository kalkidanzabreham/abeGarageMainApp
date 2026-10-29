// import express
const express = require('express');
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
// create a router
const router = express.Router();
// import the employee controller
const employeeController = require('../controllers/employee.controller');
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
router.post('/api/employee', authorize("employees:write"), validate(schemas.createEmployee), employeeController.addEmployee);

router.get('/api/employee', authorize("employees:read"), validate(schemas.listEmployees), employeeController.getAllEmployees);

router.get("/api/employee/:id", authorize("employees:read"), validate(schemas.byId), employeeController.getSingleEmployee);

router.put("/api/employee/:id", authorize("employees:write"), validate(schemas.updateEmployee), employeeController.updateEmployee);

router.delete("/api/employee/:id", authorize("employees:write"), validate(schemas.byId), employeeController.deleteEmployee);

// export the router
module.exports = router;
