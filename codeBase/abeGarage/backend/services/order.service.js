// import query function from the db.config.js file
const query = require("../config/db.config");
const { v4: uuidv4 } = require("uuid");

// a function to add a new order
const addOrder = async (order) => {
  try {
    const orderHash = uuidv4();
    const sql = `INSERT INTO orders (employee_id,customer_id,vehicle_id,active_order,order_hash) VALUES (?,?,?,?,?)`;
    order.active_order = order.active_order || 1;
    const data = [
      order.employee_id,
      order.customer_id,
      order.vehicle_id,
      order.active_order,
      orderHash,
    ];
    const results = await query(sql, data);
    const order_id = results.insertId;

    order.order_total_price = order.order_total_price || 0;
    order.additional_requests_completed =
      order.additional_requests_completed || 0;

    const sql2 = `INSERT INTO order_info (order_id,order_total_price,additional_requests_completed,estimated_completion_date,completion_date) VALUES (?,?,?,?,?)`;
    const data2 = [
      order_id,
      order.order_total_price,
      order.additional_requests_completed,
      order.estimated_completion_date,
      order.completion_date,
    ];
    await query(sql2, data2);

    for (const service of order.order_services) {
      service.completed = service.completed || 0;
      const sql3 = `INSERT INTO order_services (order_id,service_id,service_completed) VALUES (?,?,?)`;
      const data3 = [order_id, service.service_id, service.completed];
      await query(sql3, data3);
    }

    const sql4 = `INSERT INTO order_status (order_id,order_status) VALUES (?,?)`;
    const data4 = [order_id, order.order_completed];
    await query(sql4, data4);

    return {
      status: "success",
      message: "Order added successfully",
    };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};

// a function to update the order
const updateOrder = async (id, order) => {
  try {
    const sql1 = `UPDATE order_info SET estimated_completion_date = ?, completion_date = ? WHERE order_id = ?`;
    const data1 = [
      order.estimated_completion_date,
      order.completion_date,
      order.order_id,
    ];
    await query(sql1, data1);

    const sql2 = `UPDATE order_status SET order_status = ? WHERE order_id = ?`;
    const data2 = [order.order_completed, order.order_id];
    await query(sql2, data2);

    const sql3 = `UPDATE order_services SET service_completed = ? WHERE order_id = ? AND service_id = ?`;
    for (const service of order.order_services) {
      const data3 = [
        service.service_completed,
        order.order_id,
        service.service_id,
      ];
      await query(sql3, data3);
    }

    return {
      status: "success",
      message: "Order updated successfully",
    };
  } catch (error) {
    console.error("this is the error printed", error);
    return { status: "error", message: error.message };
  }
};

// a function to get all orders and get order by id
const getAllOrders = async () => {
  try {
    const sql = `
      SELECT 
        orders.order_id,
        orders.employee_id,
        orders.customer_id,
        orders.vehicle_id,
        orders.order_date,
        orders.active_order,
        order_info.estimated_completion_date,
        order_info.completion_date,
        order_status.order_status AS order_completed,
        order_services.service_id,
        order_services.service_completed
      FROM orders
      JOIN order_info ON orders.order_id = order_info.order_id
      JOIN order_status ON orders.order_id = order_status.order_id
      LEFT JOIN order_services ON orders.order_id = order_services.order_id
    `;
    const orders = await query(sql);
    const formattedOrders = orders.reduce((acc, cur) => {
      const order = acc.find((o) => o.order_id === cur.order_id);
      if (!order) {
        acc.push({
          order_id: cur.order_id,
          employee_id: cur.employee_id,
          customer_id: cur.customer_id,
          vehicle_id: cur.vehicle_id,
          order_date: cur.order_date,
          active_order: cur.active_order,
          estimated_completion_date: cur.estimated_completion_date,
          completion_date: cur.completion_date,
          order_completed: cur.order_completed,
          order_services: [{ service_id: cur.service_id ,service_completed: cur.service_completed}],
        });
      } else {
        order.order_services.push({ service_id: cur.service_id,service_completed: cur.service_completed });
      }
      return acc;
    }, []);
    return { status: "success", data: formattedOrders };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};

// a function to get a single order by id
const getOrderById = async (id) => {
  try {
    const sql = `SELECT * FROM orders WHERE order_id = ?`;
    const order = await query(sql, [id]);
    return { status: "success", data: order };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};

// export the functions
module.exports = {
  addOrder,
  updateOrder,
  getAllOrders,
  getOrderById,
};

