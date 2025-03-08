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
    // Update order_info table
    const sql1 = `UPDATE order_info SET estimated_completion_date = ? WHERE order_id = ?`;
    const data1 = [order.estimated_completion_date, order.order_id];
    await query(sql1, data1);

    // Update order_status table
    const sql2 = `UPDATE order_status SET order_status = ? WHERE order_id = ?`;
    const data2 = [order.order_completed, order.order_id];
    await query(sql2, data2);

    // Fetch existing services for this order from the order_services table
    const fetchExistingServicesSql = `SELECT service_id FROM order_services WHERE order_id = ?`;
    const existingServices = await query(fetchExistingServicesSql, [
      order.order_id,
    ]);

    // Extract the list of existing service_ids
    const existingServiceIds = existingServices.map(
      (service) => service.service_id
    );

    // Extract the list of updated service_ids from the order
    const updatedServiceIds = order.order_services.map(
      (service) => service.service_id
    );

    // Identify service_ids to delete (present in existing but not in updated)
    const servicesToDelete = existingServiceIds.filter(
      (serviceId) => !updatedServiceIds.includes(serviceId)
    );

    // Delete removed services from the order_services table
    if (servicesToDelete.length > 0) {
      // Dynamically generate placeholders for the IN clause
      const placeholders = servicesToDelete.map(() => "?").join(",");
      const deleteSql = `DELETE FROM order_services WHERE order_id = ? AND service_id IN (${placeholders})`;
      const deleteData = [order.order_id, ...servicesToDelete]; // Spread the array into the query parameters
      await query(deleteSql, deleteData);
    }

    // Loop through each service in the updated order
    for (const service of order.order_services) {
      // Check if the service_id exists in the order_services table for this order
      const checkSql = `SELECT * FROM order_services WHERE order_id = ? AND service_id = ?`;
      const checkData = [order.order_id, service.service_id];
      const [existingService] = await query(checkSql, checkData);

      // If the service_id does not exist, insert it into the order_services table
      if (!existingService) {
        const insertSql = `INSERT INTO order_services (order_id, service_id, service_completed) VALUES (?, ?, ?)`;
        const insertData = [
          order.order_id,
          service.service_id,
          service.service_completed || 0,
        ]; // Default to 0 if not provided
        await query(insertSql, insertData);
      } else {
        // If the service_id exists, update the service_completed status
        const updateSql = `UPDATE order_services SET service_completed = ? WHERE order_id = ? AND service_id = ?`;
        const updateData = [
          service.service_completed,
          order.order_id,
          service.service_id,
        ];
        await query(updateSql, updateData);
      }
    }

    return {
      status: "success",
      message: "Order updated successfully",
    };
  } catch (error) {
    console.error("Error updating order:", error);
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
        orders.order_hash,
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
      ORDER BY orders.order_id DESC
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
          order_hash: cur.order_hash,
          estimated_completion_date: cur.estimated_completion_date,
          completion_date: cur.completion_date,
          order_completed: cur.order_completed,
          order_services: [
            {
              service_id: cur.service_id,
              service_completed: cur.service_completed,
            },
          ],
        });
      } else {
        order.order_services.push({
          service_id: cur.service_id,
          service_completed: cur.service_completed,
        });
      }
      return acc;
    }, []);
    return { status: "success", data: formattedOrders };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};

const getOrderById = async (id) => {
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
    order_services.service_completed,
    common_services.service_name,
    common_services.service_description,
    customer_identifier.customer_email,
    customer_identifier.customer_phone_number,
    customer_info.customer_first_name,
    customer_info.customer_last_name,
    customer_info.active_customer_status,
    customer_vehicle_info.vehicle_make,
    customer_vehicle_info.vehicle_model,
    customer_vehicle_info.vehicle_tag,
    customer_vehicle_info.vehicle_color,
    customer_vehicle_info.vehicle_mileage,
    customer_vehicle_info.vehicle_year
  FROM orders
  JOIN order_info ON orders.order_id = order_info.order_id
  JOIN order_status ON orders.order_id = order_status.order_id
  INNER JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
  INNER JOIN customer_info ON orders.customer_id = customer_info.customer_id
  INNER JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
  LEFT JOIN order_services ON orders.order_id = order_services.order_id
  LEFT JOIN common_services ON order_services.service_id = common_services.service_id
  WHERE orders.order_id = ?
`;
    const orders = await query(sql, [id]);
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
          customer_first_name: cur.customer_first_name,
          customer_email: cur.customer_email,
          customer_phone_number: cur.customer_phone_number,
          customer_last_name: cur.customer_last_name,
          active_customer_status: cur.active_customer_status,
          vehicle_make: cur.vehicle_make,
          vehicle_model: cur.vehicle_model,
          vehicle_year: cur.vehicle_year,
          vehicle_tag: cur.vehicle_tag,
          vehicle_mileage: cur.vehicle_mileage,
          vehicle_color: cur.vehicle_color,
          order_completed: cur.order_completed,
          order_services: [
            {
              service_id: cur.service_id,
              service_completed: cur.service_completed,
              service_name: cur.service_name, // Add service_name
              service_description: cur.service_description, // Add service_description
            },
          ],
        });
      } else {
        order.order_services.push({
          service_id: cur.service_id,
          service_completed: cur.service_completed,
          service_name: cur.service_name, // Add service_name
          service_description: cur.service_description, // Add service_description
        });
      }
      return acc;
    }, []);
    return { status: "success", data: formattedOrders };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};
// get order by hash
const getOrderByHash = async (hash) => {
  const order_id = await query(`SELECT order_id FROM orders WHERE order_hash = ?`, [
    hash,
  ])
  const id = order_id[0].order_id;
  // console.log(id);

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
    order_services.service_completed,
    common_services.service_name,
    common_services.service_description,
    customer_identifier.customer_email,
    customer_identifier.customer_phone_number,
    customer_info.customer_first_name,
    customer_info.customer_last_name,
    customer_info.active_customer_status,
    customer_vehicle_info.vehicle_make,
    customer_vehicle_info.vehicle_model,
    customer_vehicle_info.vehicle_tag,
    customer_vehicle_info.vehicle_color,
    customer_vehicle_info.vehicle_mileage,
    customer_vehicle_info.vehicle_year
  FROM orders
  JOIN order_info ON orders.order_id = order_info.order_id
  JOIN order_status ON orders.order_id = order_status.order_id
  INNER JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
  INNER JOIN customer_info ON orders.customer_id = customer_info.customer_id
  INNER JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
  LEFT JOIN order_services ON orders.order_id = order_services.order_id
  LEFT JOIN common_services ON order_services.service_id = common_services.service_id
  WHERE orders.order_id = ?
`;
    const orders = await query(sql, [id]);
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
          customer_first_name: cur.customer_first_name,
          customer_email: cur.customer_email,
          customer_phone_number: cur.customer_phone_number,
          customer_last_name: cur.customer_last_name,
          active_customer_status: cur.active_customer_status,
          vehicle_make: cur.vehicle_make,
          vehicle_model: cur.vehicle_model,
          vehicle_year: cur.vehicle_year,
          vehicle_tag: cur.vehicle_tag,
          vehicle_mileage: cur.vehicle_mileage,
          vehicle_color: cur.vehicle_color,
          order_completed: cur.order_completed,
          order_services: [
            {
              service_id: cur.service_id,
              service_completed: cur.service_completed,
              service_name: cur.service_name, // Add service_name
              service_description: cur.service_description, // Add service_description
            },
          ],
        });
      } else {
        order.order_services.push({
          service_id: cur.service_id,
          service_completed: cur.service_completed,
          service_name: cur.service_name, // Add service_name
          service_description: cur.service_description, // Add service_description
        });
      }
      return acc;
    }, []);
    return { status: "success", data: formattedOrders };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
};
const getAllOrdersPerCustomer = async (customer_id) => {
  try {
    const singleOrderInfo = `
      SELECT 
        orders.order_id,
        orders.employee_id,
        orders.customer_id,
        orders.vehicle_id,
        orders.order_date,
        orders.active_order,
        orders.order_hash,
        order_info.order_total_price,
        order_info.estimated_completion_date,
        order_info.completion_date,
        order_info.additional_request,
        order_info.additional_requests_completed,
        order_status.order_status,
        customer_info.customer_first_name,
        customer_info.customer_last_name,
        customer_identifier.customer_phone_number,
        customer_identifier.customer_email,
        customer_vehicle_info.vehicle_type,
        customer_vehicle_info.vehicle_year,
        customer_vehicle_info.vehicle_tag,
        customer_vehicle_info.vehicle_mileage,
        employee_info.employee_first_name,
        employee_info.employee_last_name,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'order_service_id', order_services.order_service_id,
            'order_status',order_status.order_status,
            'service_id', order_services.service_id,
            'service_completed', order_services.service_completed,
            'service_name', common_services.service_name,
            'service_description', common_services.service_description
          )
        ) AS order_services
      FROM orders
      INNER JOIN order_info ON orders.order_id = order_info.order_id
      INNER JOIN order_status ON order_status.order_id = orders.order_id
      INNER JOIN customer_info ON orders.customer_id = customer_info.customer_id
      INNER JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
      INNER JOIN employee_info ON orders.employee_id = employee_info.employee_id
      INNER JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
      LEFT JOIN order_services ON order_services.order_id = orders.order_id
      LEFT JOIN common_services ON order_services.service_id = common_services.service_id
      WHERE orders.customer_id = ? 
      GROUP BY 
        orders.order_id,
        orders.employee_id,
        orders.customer_id,
        orders.vehicle_id,
        orders.order_date,
        orders.active_order,
        orders.order_hash,
        order_info.order_total_price,
        order_info.estimated_completion_date,
        order_info.completion_date,
        order_info.additional_request,
        order_info.additional_requests_completed,
        order_status.order_status,
        customer_info.customer_first_name,
        customer_info.customer_last_name,
        customer_identifier.customer_phone_number,
        customer_identifier.customer_email,
        customer_vehicle_info.vehicle_type,
        customer_vehicle_info.vehicle_year,
             customer_vehicle_info.vehicle_tag,
        customer_vehicle_info.vehicle_mileage,
        employee_info.employee_first_name,
        employee_info.employee_last_name
    `;

    const result = await query(singleOrderInfo, [customer_id]);
    return result;
  } catch (error) {
    console.log("Error in getSingleOrderInfo:", error);
  }
};
const getSingleOrderInfo = async (order_id) => {
  try {
    const singleOrderInfo = `
      SELECT 
        orders.order_id,
        orders.employee_id,
        orders.customer_id,
        orders.vehicle_id,
        orders.order_date,
        orders.active_order,
        orders.order_hash,
        order_info.order_total_price,
        order_info.estimated_completion_date,
        order_info.completion_date,
   
        order_info.additional_requests_completed,
        order_status.order_status,
        customer_info.customer_first_name,
        customer_info.customer_last_name,
        customer_identifier.customer_phone_number,
        customer_identifier.customer_email,
        customer_vehicle_info.vehicle_type,
        customer_vehicle_info.vehicle_year,
        customer_vehicle_info.vehicle_tag,
        customer_vehicle_info.vehicle_mileage,
        employee_info.employee_first_name,
        employee_info.employee_last_name,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'order_service_id', order_services.order_service_id,
            'order_status',order_status.order_status,
            'service_id', order_services.service_id,
            'service_completed', order_services.service_completed,
            'service_name', common_services.service_name,
            'service_description', common_services.service_description,
            'additional_services',   order_info.additional_request
          )
        ) AS order_services
      FROM orders
      INNER JOIN order_info ON orders.order_id = order_info.order_id
      INNER JOIN order_status ON order_status.order_id = orders.order_id
      INNER JOIN customer_info ON orders.customer_id = customer_info.customer_id
      INNER JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
      INNER JOIN employee_info ON orders.employee_id = employee_info.employee_id
      INNER JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
      LEFT JOIN order_services ON order_services.order_id = orders.order_id
      LEFT JOIN common_services ON order_services.service_id = common_services.service_id
      WHERE orders.order_id = ?
      GROUP BY 
        orders.order_id,
        orders.employee_id,
        orders.customer_id,
        orders.vehicle_id,
        orders.order_date,
        orders.active_order,
        orders.order_hash,
        order_info.order_total_price,
        order_info.estimated_completion_date,
        order_info.completion_date,
        order_info.additional_request,
        order_info.additional_requests_completed,
        order_status.order_status,
        customer_info.customer_first_name,
        customer_info.customer_last_name,
        customer_identifier.customer_phone_number,
        customer_identifier.customer_email,
        customer_vehicle_info.vehicle_type,
        customer_vehicle_info.vehicle_year,
             customer_vehicle_info.vehicle_tag,
        customer_vehicle_info.vehicle_mileage,
        employee_info.employee_first_name,
        employee_info.employee_last_name
    `;

    const result = await query(singleOrderInfo, [order_id]);
    return result;
  } catch (error) {
    console.log("Error in getSingleOrderInfo:", error);
  }
};


// export the functions
module.exports = {
  addOrder,
  updateOrder,
  getAllOrders,
  getOrderById,
  getOrderByHash,
  getAllOrdersPerCustomer,
  getSingleOrderInfo
};
