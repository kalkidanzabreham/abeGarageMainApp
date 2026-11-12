const { wrapAll } = require("../utils/asyncHandler");
// import login servie
// import loginService from '../services/login.service';
const loginService = require("../services/login.service");
// import jwt
const jwt = require("jsonwebtoken");
// import jwt secret key
const { JWT_SECRET: secret, JWT_EXPIRES_IN, DEMO_TOKEN_EXPIRES_IN } = require("../config/env");
const { AppError } = require("../utils/AppError");

// define login function
const login = async (req, res) => {
  // throws 401 / 403 on bad credentials or a deactivated account
  const employee = await loginService.login(req.body);
  // define a payload
  const payload = {
    employee_role_id: employee.company_role_id,
    employee_id: employee.employee_id,
    employee_first_name: employee.employee_first_name,
  };
  // generate token
  const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
  return res.status(200).send({
    token: token,
    message: "Login successful",
    status: "success",
  });
};

// POST /api/employee/demo-login (only mounted when DEMO_LOGIN_ENABLED=true).
// Unlike the guest login removed in Phase 1, which handed a working token to
// anyone, this only ever signs in the Demo role, which the API refuses every
// write for (config/permissions.js + denyDemoWrites); the token is short-lived
// and the route is rate-limited per IP.
const demoLogin = async (req, res) => {
  const employee = await loginService.demoAccount();
  if (!employee) {
    throw new AppError(404, "DEMO_UNAVAILABLE", "The demo account is not available right now.");
  }
  const payload = {
    employee_role_id: employee.company_role_id,
    employee_id: employee.employee_id,
    employee_first_name: employee.employee_first_name,
  };
  const token = jwt.sign(payload, secret, { expiresIn: DEMO_TOKEN_EXPIRES_IN });
  req.log.info({ event: "demo_login" }, "demo login");
  return res.status(200).send({ token, message: "Demo login successful", status: "success" });
};

module.exports = wrapAll({
  login,
  demoLogin,
});
