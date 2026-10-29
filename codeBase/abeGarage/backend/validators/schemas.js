// Request schemas for every route. Used via validate() in the route files.
const { z, id, idParam, listQuery, email, requiredText, optionalText, flag, roleId, optionalDate } = require("./common");

const login = {
  // strings only: an object here used to be expanded by mysql2 into SQL
  // (WHERE employee_email = `employee_email` = 1)
  body: z.object({
    employee_email: email,
    employee_password: z.string().min(1).max(72),
  }),
};

const customerFields = {
  customer_first_name: requiredText(),
  customer_last_name: optionalText(),
  customer_phone_number: optionalText(50),
  active_customer_status: flag.default(1),
};
const createCustomer = {
  body: z.object({ customer_email: email, ...customerFields }),
};
// edit replaces every field, so all are required (a missing field would
// otherwise silently blank the stored value)
const updateCustomer = {
  params: idParam(),
  body: z.object({
    customer_first_name: requiredText(),
    customer_last_name: z.string().trim().max(255),
    customer_phone_number: z.string().trim().max(50),
    active_customer_status: flag,
  }),
};

const employeeProfile = {
  employee_first_name: requiredText(),
  employee_last_name: requiredText(),
  employee_phone: requiredText(50),
  company_role_id: roleId,
};
const createEmployee = {
  body: z.object({
    employee_email: email,
    // bcrypt only uses the first 72 bytes
    employee_password: z.string().min(8).max(72),
    active_employee: flag.default(1),
    ...employeeProfile,
  }),
};
const updateEmployee = {
  params: idParam(),
  body: z.object({ ...employeeProfile, active_employee: flag }),
};

const serviceBody = z.object({
  service_name: requiredText(),
  service_description: optionalText(2000),
  // DECIMAL(10,2); order totals are computed from this
  service_price: z.coerce.number().min(0).max(99_999_999.99).multipleOf(0.01),
});
const createService = { body: serviceBody };
const updateService = { params: idParam(), body: serviceBody };

const vehicleBody = z.object({
  vehicle_year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  vehicle_make: requiredText(),
  vehicle_model: requiredText(),
  vehicle_type: optionalText(),
  vehicle_mileage: z.coerce.number().int().min(0).max(5_000_000),
  vehicle_tag: optionalText(),
  vehicle_serial: optionalText(),
  vehicle_color: optionalText(),
});
const createVehicle = { params: idParam("customer_id"), body: vehicleBody };
const updateVehicle = { params: idParam("vehicle_id"), body: vehicleBody };

// 0 received, 1 in progress, 2 completed (3 was a second "completed" value
// written by the edit page; migration 005 converted those to 2)
const orderStatus = z.coerce.number().int().min(0).max(2);
const uniqueServiceIds = (list) =>
  new Set(list.map((s) => s.service_id)).size === list.length;

const createOrder = {
  // employee_id is NOT accepted: the creator is taken from the token
  body: z.object({
    customer_id: id,
    vehicle_id: id,
    estimated_completion_date: optionalDate.default(null),
    order_completed: orderStatus.default(0),
    order_services: z
      .array(z.object({ service_id: id }))
      .min(1, "Select at least one service")
      .max(50)
      .refine(uniqueServiceIds, "Each service can only be added once"),
  }),
};
const updateOrder = {
  params: idParam(),
  body: z.object({
    estimated_completion_date: optionalDate,
    order_completed: orderStatus,
    order_services: z
      .array(z.object({ service_id: id, service_completed: flag.default(0) }))
      .min(1, "An order needs at least one service")
      .max(50)
      .refine(uniqueServiceIds, "Each service can only be added once"),
  }),
};

// list endpoints: GET /api/customers, /vehicles, /orders, /employee
const listCustomers = { query: listQuery({ active: flag.optional() }) };
const listVehicles = { query: listQuery({ customer_id: id.optional() }) };
const listOrders = { query: listQuery({ status: orderStatus.optional(), customer_id: id.optional() }) };
const listEmployees = { query: listQuery({ role: roleId.optional(), active: flag.optional() }) };

const byId = { params: idParam() };
const byCustomerId = { params: idParam("customer_id") };
const byVehicleId = { params: idParam("vehicle_id") };
const byHash = {
  params: z.object({ hash: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid order link") }),
};
const none = {};

module.exports = {
  login,
  createCustomer, updateCustomer,
  createEmployee, updateEmployee,
  createService, updateService,
  createVehicle, updateVehicle,
  createOrder, updateOrder,
  listCustomers, listVehicles, listOrders, listEmployees,
  byId, byCustomerId, byVehicleId, byHash, none,
};
