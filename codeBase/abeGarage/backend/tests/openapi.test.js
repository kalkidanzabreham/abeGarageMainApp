// The API docs stay in sync with the routes Express actually serves.
const { api, closeDb } = require("./helpers");
const app = require("../app");
const { ROUTES } = require("../docs/openapi");

afterAll(closeDb);

// every "METHOD /path" registered on the app, including nested routers;
// Express ":id" becomes OpenAPI "{id}"
const expressRoutes = (stack, out = new Set()) => {
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        out.add(`${method.toUpperCase()} ${layer.route.path.replace(/:(\w+)/g, "{$1}")}`);
      }
    } else if (layer.handle && layer.handle.stack) {
      expressRoutes(layer.handle.stack, out);
    }
  }
  return out;
};
const DOCS_ROUTES = new Set(["GET /api/openapi.json"]);

test("every Express route is documented, and every documented route exists", () => {
  const served = [...expressRoutes(app._router.stack)].filter((r) => !DOCS_ROUTES.has(r)).sort();
  const documented = ROUTES.map(([method, path]) => `${method.toUpperCase()} ${path}`).sort();
  expect(documented).toEqual(served);
});

test("GET /api/openapi.json is a public OpenAPI 3.1 document", async () => {
  const res = await api().get("/api/openapi.json");
  expect(res.status).toBe(200);
  expect(res.body.openapi).toBe("3.1.0");
  expect(res.body.components.securitySchemes.token).toEqual({ type: "apiKey", in: "header", name: "x-access-token" });
});

test("every path parameter in a URL template is declared", async () => {
  const { body: spec } = await api().get("/api/openapi.json");
  for (const [path, operations] of Object.entries(spec.paths)) {
    const names = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    for (const op of Object.values(operations)) {
      const declared = op.parameters.filter((p) => p.in === "path").map((p) => p.name);
      expect(declared.sort()).toEqual(names.sort());
    }
  }
});

test("request bodies come from the validation schemas (e.g. order status is limited to 0-2)", async () => {
  const { body: spec } = await api().get("/api/openapi.json");
  const body = spec.paths["/api/order/{id}"].put.requestBody.content["application/json"].schema;
  expect(body.properties.order_completed).toMatchObject({ type: "integer", minimum: 0, maximum: 2 });
  const login = spec.paths["/api/employee/login"].post;
  expect(login.security).toEqual([]);
  expect(login.requestBody.content["application/json"].schema.required).toEqual(["employee_email", "employee_password"]);
});

test("protected routes document the role and the 401/403 responses", async () => {
  const { body: spec } = await api().get("/api/openapi.json");
  const createOrder = spec.paths["/api/order"].post;
  expect(createOrder.description).toBe("Permission `orders:create`: Admin, Manager.");
  expect(Object.keys(createOrder.responses)).toEqual(expect.arrayContaining(["201", "400", "401", "403"]));
});

test("/api/docs serves the Swagger UI page", async () => {
  const res = await api().get("/api/docs/");
  expect(res.status).toBe(200);
  expect(res.text).toContain("swagger-ui");
});
