const query = require("../config/db.config");

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
  console.log(result);
  return result;
};
module.exports = {
  addVehicleForCustomer,
  customerVehicle,
  singleVehicle,
  editVehicleInfo,
};

// Example Usage
