// import query function from the db.config.js file
const query = require("../config/db.config");
const { withTransaction } = require("../config/db.config");
const { v4: uuidv4 } = require("uuid");
const { notFound, badRequest } = require("../utils/AppError");

// Look up catalog prices for the given service ids and return the order
// total. The total is ALWAYS computed here from the catalog; a total sent
// by the client is never used (the schema strips it). Unknown ids -> 400.
// Summed in integer cents so 0.1 + 0.2 style float errors cannot appear.
const priceServices = async (txQuery, serviceIds) => {
  const rows = await txQuery(
    `SELECT service_id, service_price FROM common_services WHERE service_id IN (?)`,
    [serviceIds]
  );
  const found = new Set(rows.map((r) => r.service_id));
  const unknown = serviceIds.filter((sid) => !found.has(sid));
  if (unknown.length > 0) {
    throw badRequest(`Unknown service id(s): ${unknown.join(", ")}`);
  }
  const cents = rows.reduce((sum, r) => sum + Math.round(r.service_price * 100), 0);
  return cents / 100;
};

// a function to add a new order
// employeeId is the logged-in employee (from the JWT), never the request
// body: a client could otherwise record any employee as the order's creator.
const addOrder = async (order, employeeId) => {
  // all five tables are written atomically; no half-created orders
  return await withTransaction(async (txQuery) => {
    const [vehicle] = await txQuery(
      `SELECT vehicle_id FROM customer_vehicle_info WHERE vehicle_id = ? AND customer_id = ?`,
      [order.vehicle_id, order.customer_id]
    );
    if (!vehicle) {
      throw badRequest("Vehicle does not belong to this customer");
    }
    const serviceIds = order.order_services.map((s) => s.service_id);
    const total = await priceServices(txQuery, serviceIds);

    const results = await txQuery(
      `INSERT INTO orders (employee_id,customer_id,vehicle_id,active_order,order_hash) VALUES (?,?,?,?,?)`,
      [employeeId, order.customer_id, order.vehicle_id, 1, uuidv4()]
    );
    const order_id = results.insertId;

    await txQuery(
      `INSERT INTO order_info (order_id,order_total_price,additional_requests_completed,estimated_completion_date) VALUES (?,?,?,?)`,
      [order_id, total, 0, order.estimated_completion_date]
    );
    // one multi-row INSERT instead of one query per service
    await txQuery(
      `INSERT INTO order_services (order_id,service_id,service_completed) VALUES ?`,
      [serviceIds.map((sid) => [order_id, sid, 0])]
    );
    await txQuery(`INSERT INTO order_status (order_id,order_status) VALUES (?,?)`, [
      order_id,
      order.order_completed,
    ]);

    return {
      status: "success",
      message: "Order added successfully",
      order_id,
      order_total_price: total,
    };
  });
};

// a function to update the order
const updateOrder = async (id, order) => {
  // the order and its service list change together or not at all
  return await withTransaction(async (txQuery) => {
    // The order to update is the one in the URL. The body's order_id used to
    // be used instead, so PUT /api/order/5 could silently modify order 7.
    const [existing] = await txQuery(
      `SELECT order_id FROM orders WHERE order_id = ? FOR UPDATE`,
      [id]
    );
    if (!existing) {
      throw notFound("Order not found");
    }
    const serviceIds = order.order_services.map((s) => s.service_id);
    const total = await priceServices(txQuery, serviceIds);

    await txQuery(
      `UPDATE order_info SET estimated_completion_date = ?, order_total_price = ? WHERE order_id = ?`,
      [order.estimated_completion_date, total, id]
    );
    await txQuery(`UPDATE order_status SET order_status = ? WHERE order_id = ?`, [
      order.order_completed,
      id,
    ]);

    // Sync the service list in 2 statements (was 1 SELECT + 1 write per
    // service): drop services no longer listed, then upsert the rest.
    // The upsert relies on UNIQUE (order_id, service_id) from migration 003.
    await txQuery(
      `DELETE FROM order_services WHERE order_id = ? AND service_id NOT IN (?)`,
      [id, serviceIds]
    );
    await txQuery(
      `INSERT INTO order_services (order_id, service_id, service_completed) VALUES ?
       ON DUPLICATE KEY UPDATE service_completed = VALUES(service_completed)`,
      [order.order_services.map((s) => [id, s.service_id, s.service_completed])]
    );

    return {
      status: "success",
      message: "Order updated successfully",
      order_total_price: total,
    };
  });
};

// a function to get all orders and get order by id
// One query returns each order with its customer, vehicle and the name of
// the employee who created it. The order list used to fetch customer,
// vehicle and employee separately for every row (3 requests per order), and
// the employee lookup needs employees:read, which Mechanics don't have.
const getAllOrders = async () => {
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
      order_info.order_total_price,
      order_status.order_status AS order_completed,
      customer_info.customer_first_name,
      customer_info.customer_last_name,
      customer_identifier.customer_email,
      customer_identifier.customer_phone_number,
      customer_vehicle_info.vehicle_make,
      customer_vehicle_info.vehicle_model,
      customer_vehicle_info.vehicle_year,
      customer_vehicle_info.vehicle_tag,
      employee_info.employee_first_name,
      employee_info.employee_last_name,
      order_services.service_id,
      order_services.service_completed
    FROM orders
    JOIN order_info ON orders.order_id = order_info.order_id
    JOIN order_status ON orders.order_id = order_status.order_id
    JOIN customer_info ON orders.customer_id = customer_info.customer_id
    JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
    JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
    LEFT JOIN employee_info ON orders.employee_id = employee_info.employee_id
    LEFT JOIN order_services ON orders.order_id = order_services.order_id
    ORDER BY orders.order_id DESC
  `;
  const rows = await query(sql);
  // group the one-row-per-service result into one object per order
  // (Map keeps insertion order, so the ORDER BY is preserved)
  const byId = new Map();
  for (const cur of rows) {
    let order = byId.get(cur.order_id);
    if (!order) {
      const { service_id, service_completed, ...orderFields } = cur;
      order = { ...orderFields, order_services: [] };
      byId.set(cur.order_id, order);
    }
    // LEFT JOIN yields one row with service_id NULL for an order with no
    // services; don't turn it into a phantom service entry
    if (cur.service_id !== null) {
      order.order_services.push({
        service_id: cur.service_id,
        service_completed: cur.service_completed,
      });
    }
  }
  return { status: "success", data: [...byId.values()] };
};

const getOrderById = async (id) => {
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
  order_info.order_total_price,
  order_status.order_status AS order_completed,
  order_services.service_id,
  order_services.service_completed,
  common_services.service_name,
  common_services.service_description,
  common_services.service_price,
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
        order_total_price: cur.order_total_price,
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
        // LEFT JOIN yields one row with service_id NULL when an order has no
        // services; don't turn it into a phantom service entry
        order_services: cur.service_id === null ? [] : [
          {
            service_id: cur.service_id,
            service_completed: cur.service_completed,
            service_name: cur.service_name, // Add service_name
            service_description: cur.service_description, // Add service_description
            service_price: cur.service_price,
          },
        ],
      });
    } else if (cur.service_id !== null) {
      order.order_services.push({
        service_id: cur.service_id,
        service_completed: cur.service_completed,
        service_name: cur.service_name, // Add service_name
        service_description: cur.service_description, // Add service_description
        service_price: cur.service_price,
      });
    }
    return acc;
  }, []);
  return { status: "success", data: formattedOrders };
};
// get order by hash
// Resolves the hash to an id and reuses getOrderById (this used to be a
// ~90-line copy of it). An unknown hash used to throw a TypeError on
// order_id[0]; it now returns an empty list and the controller sends 404.
const getOrderByHash = async (hash) => {
  const rows = await query(`SELECT order_id FROM orders WHERE order_hash = ?`, [
    hash,
  ]);
  if (rows.length === 0) {
    return { status: "success", data: [] };
  }
  return getOrderById(rows[0].order_id);
};
const getAllOrdersPerCustomer = async (customer_id) => {
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
};
const getSingleOrderInfo = async (order_id) => {
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
