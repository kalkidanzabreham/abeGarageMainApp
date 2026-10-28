const { wrapAll } = require("../utils/asyncHandler");
// import login servie
// import loginService from '../services/login.service';
const loginService = require("../services/login.service");
// import jwt
const jwt = require("jsonwebtoken");
// import jwt secret key
const { JWT_SECRET: secret, JWT_EXPIRES_IN } = require("../config/env");

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

// export the login function
module.exports = wrapAll({
  login,
});
