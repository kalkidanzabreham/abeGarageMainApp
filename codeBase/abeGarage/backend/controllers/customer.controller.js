// import customer service
const customerService = require("../services/customer.service");
const { notFound, conflict } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");
const { paginationMeta } = require("../utils/pagination");

// Errors are thrown and handled by middlewares/error.middleware.js
const addCustomer = async (req, res) => {
  const checkEmail = await customerService.checkIfCustomerExists(
    req.body.customer_email
  );
  if (checkEmail) {
    throw conflict("Email already exists");
  }
  const newCustomer = await customerService.addCustomer(req.body);
  res.status(201).json({
    message: "Customer added successfully",
    customer: newCustomer,
  });
};

const getAllCustomers = async (req, res) => {
  const { rows, total } = await customerService.getAllCustomers(req.query);
  res.status(200).json({ data: rows, pagination: paginationMeta(req.query, total) });
};

const singleCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.getSingleCustomer(id);
  if (customer.length === 0) {
    throw notFound("Customer not found");
  }
  res.status(200).json({ data: customer });
};

const editCustomerInfo = async (req, res) => {
  const { id } = req.params;
  const updatedCustomer = await customerService.editCustomer(id, req.body);
  if (updatedCustomer.affectedRows === 0) {
    throw notFound("Customer not found");
  }
  res.status(200).json({
    message: "Customer updated successfully",
    customer: updatedCustomer,
  });
};

module.exports = wrapAll({
  addCustomer,
  getAllCustomers,
  singleCustomer,
  editCustomerInfo,
});
