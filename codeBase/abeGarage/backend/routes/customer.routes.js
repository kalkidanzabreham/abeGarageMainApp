const express = require("express");
const routes = express.Router();
const customer = require("../controllers/customer.controller");
const { verifyAdmin } = require("../middlewares/auth.middleware");

routes.post("/api/customers",[verifyAdmin] ,customer.addCustomer);

routes.get("/api/customers", customer.getAllCustomers);

routes.get("/api/customers/:id", customer.singleCustomer);

routes.put("/api/customers/:id",[verifyAdmin],customer.editCustomerInfo);


module.exports = routes;
