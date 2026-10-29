// import routes
const express = require("express");
const { authenticate, denyDemoWrites } = require("../middlewares/auth.middleware");
const router = express.Router();
// (GET /install was removed: the schema is managed by Knex migrations,
// `npm run migrate`, instead of a public HTTP endpoint)

// ---- public routes ----
router.use(require("./health.routes"));
router.use(require("./login.routes"));
router.use(require("./tracking.routes"));

// ---- everything below requires a valid token (secure by default: a new
// route cannot be accidentally left public) ----
router.use(authenticate, denyDemoWrites);
router.use(require("./employee.routes"));
router.use(require("./service.routes"));
router.use(require("./order.routes"));
router.use(require("./customer.routes"));
router.use(require("./vehicle.routes"));

// export router
module.exports = router;
