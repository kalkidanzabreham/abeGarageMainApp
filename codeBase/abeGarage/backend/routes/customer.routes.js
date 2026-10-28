const express = require("express");
const routes = express.Router();
const customer = require("../controllers/customer.controller");
const { authorize } = require("../middlewares/auth.middleware");

// authentication is applied to every route in routes/index.js
routes.post("/api/customers", authorize("customers:write"), customer.addCustomer);

routes.get("/api/customers", authorize("customers:read"), customer.getAllCustomers);

routes.get("/api/customers/:id", authorize("customers:read"), customer.singleCustomer);

routes.put("/api/customers/:id", authorize("customers:write"), customer.editCustomerInfo);

module.exports = routes;
