// import order service
const orderService = require("../services/order.service");
// define a function to handle the add order request
const addOrder = async (req, res) => {
  try {
    const response = await orderService.addOrder(req.body);
    if (response.status === "success") {
      res.status(201).send(response);
    } else {
      res.status(400).send(response);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
// a function to update the order
const updateOrder = async (req, res) => {
  try {
    const response = await orderService.updateOrder(req.params.id, req.body);
    if (response.status === "success") {
      res.status(200).send(response);
    } else {
      res.status(400).send(response);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
// implement getAllOrders and getOrderById
// // a function to get all orders
const getAllOrders = async (req, res) => {
  try {
    const response = await orderService.getAllOrders();
    if (response.status === "success") {
      res.status(200).send(response);
    } else {
      res.status(400).send(response);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getOrderById = async (req, res) => {
  try {
    const response = await orderService.getOrderById(req.params.id);
    if (response.status === "success") {
      res.status(200).send(response.data);
    } else {
      res.status(400).send(response);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getsinglecustomersOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getAllOrdersPerCustomer(id);
    if (!order) {
      return res.status(400).json({ error: "Failed to get order" });
    } else {
      return res.status(200).json({
        data: order,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const getsingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getSingleOrderInfo(id);
    if (!order) {
      return res.status(400).json({ error: "Failed to get order" });
    } else {
      return res.status(200).json({
        data: order,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
// export the functions
module.exports = {
  addOrder,
  updateOrder,
  getAllOrders,
  getOrderById,
  getsinglecustomersOrder,
  getsingleOrder
};
