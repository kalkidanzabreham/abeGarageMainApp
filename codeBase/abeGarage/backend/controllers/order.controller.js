// import order service
const orderService = require("../services/order.service");
const { notFound } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");
const { paginationMeta } = require("../utils/pagination");

// Errors are thrown and handled by middlewares/error.middleware.js

// define a function to handle the add order request
const addOrder = async (req, res) => {
  const response = await orderService.addOrder(req.body, req.user.employee_id);
  res.status(201).send(response);
};

// a function to update the order
const updateOrder = async (req, res) => {
  const response = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).send(response);
};

// a function to get all orders
const getAllOrders = async (req, res) => {
  const { status, data, total } = await orderService.getAllOrders(req.query);
  res.status(200).send({ status, data, pagination: paginationMeta(req.query, total) });
};

const getOrderById = async (req, res) => {
  const response = await orderService.getOrderById(req.params.id);
  if (response.data.length === 0) {
    throw notFound("Order not found");
  }
  res.status(200).send(response.data);
};

// a function to get order by hash
const getOrderByHash = async (req, res) => {
  const response = await orderService.getOrderByHash(req.params.hash);
  if (response.data.length === 0) {
    throw notFound("Order not found");
  }
  res.status(200).send(response.data);
};

const getsinglecustomersOrder = async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getAllOrdersPerCustomer(id);
  return res.status(200).json({
    data: order,
  });
};

const getsingleOrder = async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getSingleOrderInfo(id);
  if (order.length === 0) {
    throw notFound("Order not found");
  }
  return res.status(200).json({
    data: order,
  });
};

// export the functions
module.exports = wrapAll({
  addOrder,
  updateOrder,
  getAllOrders,
  getOrderById,
  getOrderByHash,
  getsinglecustomersOrder,
  getsingleOrder,
});
