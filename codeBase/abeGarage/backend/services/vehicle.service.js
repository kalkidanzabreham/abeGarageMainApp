const query = require("../config/db.config");
const { limitOffset, likePattern, whereClause } = require("../utils/pagination");

const addVehicleForCustomer = async (customer_id, vehicle) => {
  // Step 1: Get customer_id using customer_emai

  // Step 2: Insert vehicle data
  const vehicleQuery = `
          INSERT INTO customer_vehicle_info
          (customer_id,vehicle_year, vehicle_make, vehicle_model, vehicle_type, vehicle_mileage, vehicle_tag, vehicle_serial, vehicle_color) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

  const values = [
    customer_id,
    vehicle.vehicle_year,
    vehicle.vehicle_make,
    vehicle.vehicle_model,
    vehicle.vehicle_type,
    vehicle.vehicle_mileage,
    vehicle.vehicle_tag,
    vehicle.vehicle_serial,
    vehicle.vehicle_color,
  ];

  const result = await query(vehicleQuery, values);
  return result;
};

const customerVehicle = async (customer_id) => {
  const Vehicle = "SELECT * FROM customer_vehicle_info WHERE customer_id = ?";
  const result = await query(Vehicle, [customer_id]);
  return result;
};
const singleVehicle = async (vehicle_id) => {
  const vehicle = "SELECT * FROM customer_vehicle_info WHERE vehicle_id = ?";
  const result = await query(vehicle, [vehicle_id]);
  return result;
};
const editVehicleInfo = async (vehicle_id, vehicle) => {
  const vehicles =
    "UPDATE customer_vehicle_info SET vehicle_year =?, vehicle_make =?, vehicle_model =?, vehicle_type =?, vehicle_mileage =?, vehicle_tag =?, vehicle_serial =?, vehicle_color =? WHERE vehicle_id =?";

  const result = await query(vehicles, [
    vehicle.vehicle_year,
    vehicle.vehicle_make,
    vehicle.vehicle_model,
    vehicle.vehicle_type,
    vehicle.vehicle_mileage,
    vehicle.vehicle_tag,
    vehicle.vehicle_serial,
    vehicle.vehicle_color,
    vehicle_id,
  ]);
  return result;
};
// Paginated list of all vehicles with their owner, newest first.
// filters: q (make, model, tag or serial contains), customer_id
const listVehicles = async (filters) => {
  const like = filters.q && likePattern(filters.q);
  const where = whereClause([
    like && [
      `CONCAT(v.vehicle_make, ' ', v.vehicle_model) LIKE ? ESCAPE '\\\\'
       OR v.vehicle_tag LIKE ? ESCAPE '\\\\' OR v.vehicle_serial LIKE ? ESCAPE '\\\\'`,
      [like, like, like],
    ],
    filters.customer_id !== undefined && ["v.customer_id = ?", [filters.customer_id]],
  ]);
  const from = `FROM customer_vehicle_info v
    JOIN customer_info c ON v.customer_id = c.customer_id
    ${where.sql}`;
  const [{ total }] = await query(`SELECT COUNT(*) AS total ${from}`, where.params);
  const { limit, offset } = limitOffset(filters);
  const rows = await query(
    `SELECT v.*, c.customer_first_name, c.customer_last_name
     ${from} ORDER BY v.vehicle_id DESC LIMIT ? OFFSET ?`,
    [...where.params, limit, offset]
  );
  return { rows, total };
};

module.exports = {
  listVehicles,
  addVehicleForCustomer,
  customerVehicle,
  singleVehicle,
  editVehicleInfo,
};

// Example Usage
