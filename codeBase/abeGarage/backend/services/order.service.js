// const getSingleOrderInfo = async (order_id) => {
//   try {
//     const singleOrderInfo = `
//       SELECT 
//         orders.order_id,
//         orders.employee_id,
//         orders.customer_id,
//         orders.vehicle_id,
//         orders.order_date,
//         orders.active_order,
//         orders.order_hash,
//         order_info.order_total_price,
//         order_info.estimated_completion_date,
//         order_info.completion_date,
   
//         order_info.additional_requests_completed,
//         order_status.order_status,
//         customer_info.customer_first_name,
//         customer_info.customer_last_name,
//         customer_identifier.customer_phone_number,
//         customer_identifier.customer_email,
//         customer_vehicle_info.vehicle_type,
//         customer_vehicle_info.vehicle_year,
//         customer_vehicle_info.vehicle_tag,
//         customer_vehicle_info.vehicle_mileage,
//         employee_info.employee_first_name,
//         employee_info.employee_last_name,
//         JSON_ARRAYAGG(
//           JSON_OBJECT(
//             'order_service_id', order_services.order_service_id,
//             'order_status',order_status.order_status,
//             'service_id', order_services.service_id,
//             'service_completed', order_services.service_completed,
//             'service_name', common_services.service_name,
//             'service_description', common_services.service_description,
//             'additional_services',   order_info.additional_request
//           )
//         ) AS order_services
//       FROM orders
//       INNER JOIN order_info ON orders.order_id = order_info.order_id
//       INNER JOIN order_status ON order_status.order_id = orders.order_id
//       INNER JOIN customer_info ON orders.customer_id = customer_info.customer_id
//       INNER JOIN customer_identifier ON orders.customer_id = customer_identifier.customer_id
//       INNER JOIN employee_info ON orders.employee_id = employee_info.employee_id
//       INNER JOIN customer_vehicle_info ON orders.vehicle_id = customer_vehicle_info.vehicle_id
//       LEFT JOIN order_services ON order_services.order_id = orders.order_id
//       LEFT JOIN common_services ON order_services.service_id = common_services.service_id
//       WHERE orders.order_id = ?
//       GROUP BY 
//         orders.order_id,
//         orders.employee_id,
//         orders.customer_id,
//         orders.vehicle_id,
//         orders.order_date,
//         orders.active_order,
//         orders.order_hash,
//         order_info.order_total_price,
//         order_info.estimated_completion_date,
//         order_info.completion_date,
//         order_info.additional_request,
//         order_info.additional_requests_completed,
//         order_status.order_status,
//         customer_info.customer_first_name,
//         customer_info.customer_last_name,
//         customer_identifier.customer_phone_number,
//         customer_identifier.customer_email,
//         customer_vehicle_info.vehicle_type,
//         customer_vehicle_info.vehicle_year,
//              customer_vehicle_info.vehicle_tag,
//         customer_vehicle_info.vehicle_mileage,
//         employee_info.employee_first_name,
//         employee_info.employee_last_name
//     `;

//     const result = await conn.query(singleOrderInfo, [order_id]);
//     return result;
//   } catch (error) {
//     console.log("Error in getSingleOrderInfo:", error);
//   }
// };
