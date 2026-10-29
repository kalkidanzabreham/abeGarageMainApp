const express = require("express");
const { validate } = require("../middlewares/validate.middleware");
const schemas = require("../validators/schemas");
const routes = express.Router();
const customer = require("../controllers/customer.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
routes.post("/api/customers", authorize("customers:write"), validate(schemas.createCustomer), customer.addCustomer);

routes.get("/api/customers", authorize("customers:read"), validate(schemas.none), customer.getAllCustomers);

routes.get("/api/customers/:id", authorize("customers:read"), validate(schemas.byId), customer.singleCustomer);

routes.put("/api/customers/:id", authorize("customers:write"), validate(schemas.updateCustomer), customer.editCustomerInfo);

module.exports = routes;
