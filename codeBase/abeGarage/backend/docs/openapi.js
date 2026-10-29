// OpenAPI 3.1 document for the API, served at /api/openapi.json and
// rendered at /api/docs.
//
// Request parameters and bodies are generated from the SAME zod schemas
// that validate requests (validators/schemas.js) via zod's built-in
// z.toJSONSchema, so they cannot drift from what the API accepts. Which
// roles may call a route comes from config/permissions.js. tests/openapi
// fails if a route exists in Express but not here, or the other way round.
// Response bodies are described in prose (there are no response schemas).
const { z } = require("zod");
const schemas = require("../validators/schemas");
const { PERMISSIONS } = require("../config/permissions");
const { ROLES } = require("../config/roles");

const ROLE_NAMES = Object.fromEntries(Object.entries(ROLES).map(([name, id]) => [id, name[0] + name.slice(1).toLowerCase()]));

// [method, path, tag, summary, permission (null = public), schema, success status, success description]
const ROUTES = [
  ["get", "/api/health", "System", "API and database health", null, schemas.none, 200, "{ status, db, db_check_ms, uptime_s }; 503 when the database is unreachable"],
  ["post", "/api/employee/login", "Auth", "Log in, get a JWT (send it as x-access-token)", null, schemas.login, 200, "{ token, status, message }. 10 failed attempts per IP per 15 min, then 429"],
  ["get", "/api/order/hash/{hash}", "Orders", "Customer tracking link: one order by its secret hash", null, schemas.byHash, 200, "Array with the order, its services, prices and total"],

  ["get", "/api/customers", "Customers", "List customers (paginated, newest first)", "customers:read", schemas.listCustomers, 200, "{ data: Customer[], pagination }"],
  ["get", "/api/customers/{id}", "Customers", "One customer", "customers:read", schemas.byId, 200, "{ data: [Customer] }"],
  ["post", "/api/customers", "Customers", "Add a customer", "customers:write", schemas.createCustomer, 201, "{ message, customer: { customer_id } }; 409 if the email exists"],
  ["put", "/api/customers/{id}", "Customers", "Edit a customer (all fields)", "customers:write", schemas.updateCustomer, 200, "{ message, customer }"],

  ["get", "/api/vehicles", "Vehicles", "List all vehicles with their owner (paginated)", "vehicles:read", schemas.listVehicles, 200, "{ data: Vehicle[], pagination }"],
  ["get", "/api/addvehicle/{customer_id}", "Vehicles", "Vehicles of one customer", "vehicles:read", schemas.byCustomerId, 200, "{ data: Vehicle[] }"],
  ["get", "/api/getvehicle/{vehicle_id}", "Vehicles", "One vehicle", "vehicles:read", schemas.byVehicleId, 200, "{ data: [Vehicle] }"],
  ["post", "/api/addvehicle/{customer_id}", "Vehicles", "Add a vehicle to a customer", "vehicles:write", schemas.createVehicle, 201, "{ message, vehicle_id }"],
  ["put", "/api/editvehicle/{vehicle_id}", "Vehicles", "Edit a vehicle (all fields)", "vehicles:write", schemas.updateVehicle, 200, "{ message, data }"],

  ["get", "/api/orders", "Orders", "List orders with customer, vehicle, creator and total (paginated)", "orders:read", schemas.listOrders, 200, "{ status, data: Order[], pagination }"],
  ["get", "/api/order/{id}", "Orders", "One order with services, prices and total", "orders:read", schemas.byId, 200, "Array with the order"],
  ["get", "/api/singleorder/{id}", "Orders", "One order (aggregated form)", "orders:read", schemas.byId, 200, "{ data: [Order] }"],
  ["get", "/api/singleorder_per_customer/{id}", "Orders", "All orders of one customer", "orders:read", schemas.byId, 200, "{ data: Order[] }"],
  ["post", "/api/order", "Orders", "Create an order; the total is computed from catalog prices and the creator is the caller", "orders:create", schemas.createOrder, 201, "{ status, message, order_id, order_total_price }"],
  ["put", "/api/order/{id}", "Orders", "Update status, dates and services; the total is recomputed", "orders:update", schemas.updateOrder, 200, "{ status, message, order_total_price }"],

  ["get", "/api/employee", "Employees", "List employees (paginated)", "employees:read", schemas.listEmployees, 200, "{ success, data: Employee[], pagination }"],
  ["get", "/api/employee/{id}", "Employees", "One employee", "employees:read", schemas.byId, 200, "{ status, data: Employee }"],
  ["post", "/api/employee", "Employees", "Add an employee", "employees:write", schemas.createEmployee, 200, "{ success }; 409 if the email exists"],
  ["put", "/api/employee/{id}", "Employees", "Edit an employee", "employees:write", schemas.updateEmployee, 200, "{ success, employee }"],
  ["delete", "/api/employee/{id}", "Employees", "Delete an employee (409 if they still have orders)", "employees:write", schemas.byId, 200, "{ success, message }"],

  ["get", "/api/services", "Service catalog", "List the service catalog with prices", "services:read", schemas.none, 200, "{ success, data: Service[] }"],
  ["post", "/api/services", "Service catalog", "Add a service", "services:write", schemas.createService, 200, "{ success }"],
  ["put", "/api/services/{id}", "Service catalog", "Edit a service", "services:write", schemas.updateService, 200, "{ success, message }"],
  ["delete", "/api/services/{id}", "Service catalog", "Delete a service (409 if orders use it)", "services:write", schemas.byId, 200, "{ success, message }"],
];

const jsonSchema = (schema) => {
  const out = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
  delete out.$schema;
  return out;
};

const parametersFrom = (schema, location) => {
  if (!schema) return [];
  const { properties = {}, required = [] } = jsonSchema(schema);
  return Object.entries(properties).map(([name, propertySchema]) => ({
    name,
    in: location,
    required: location === "path" || required.includes(name),
    schema: propertySchema,
    ...(propertySchema.description ? { description: propertySchema.description } : {}),
  }));
};

const errorResponse = (description) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const buildOperation = ([, path, tag, summary, permission, schema, status, success]) => {
  const roles = permission ? PERMISSIONS[permission].map((id) => ROLE_NAMES[id]).join(", ") : null;
  const operation = {
    tags: [tag],
    summary,
    description: roles ? `Permission \`${permission}\`: ${roles}.` : "Public, no token needed.",
    security: permission ? [{ token: [] }] : [],
    parameters: [...parametersFrom(schema.params, "path"), ...parametersFrom(schema.query, "query")],
    responses: {
      [status]: { description: success },
      400: errorResponse("Validation error (details lists every problem)"),
    },
  };
  if (schema.body) {
    operation.requestBody = { required: true, content: { "application/json": { schema: jsonSchema(schema.body) } } };
  }
  if (permission) {
    operation.responses[401] = errorResponse("Missing, invalid or expired token");
    operation.responses[403] = errorResponse("Role not allowed (Demo: any write)");
  }
  if (path.includes("{")) operation.responses[404] = errorResponse("Not found");
  return operation;
};

const buildSpec = () => {
  const paths = {};
  for (const route of ROUTES) {
    const [method, path] = route;
    paths[path] = { ...paths[path], [method]: buildOperation(route) };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "GarageHub API",
      version: "1.0.0",
      description:
        "Garage management API. Log in with POST /api/employee/login, then send the token in the " +
        "x-access-token header. Errors always look like { status: \"error\", code, message, details? }.",
    },
    components: {
      securitySchemes: { token: { type: "apiKey", in: "header", name: "x-access-token" } },
      schemas: {
        Error: {
          type: "object",
          required: ["status", "code", "message"],
          properties: {
            status: { const: "error" },
            code: { type: "string", examples: ["VALIDATION_ERROR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND"] },
            message: { type: "string" },
            details: {
              type: "array",
              items: { type: "object", properties: { location: { type: "string" }, path: { type: "string" }, message: { type: "string" } } },
            },
          },
        },
      },
    },
    paths,
  };
};

module.exports = { ROUTES, buildSpec };
