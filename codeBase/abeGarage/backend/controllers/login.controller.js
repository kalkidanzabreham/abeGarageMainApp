// import login servie
// import loginService from '../services/login.service';
const loginService = require("../services/login.service");
// import jwt
const jwt = require("jsonwebtoken");
// import jwt secret key
const secret = process.env.JWT_SECRET;

// define login function
const login = async (req, res) => {
  const employee = await loginService.login(req.body);
  if (employee.status === "fail") {
    return res.status(400).send(employee);
  } else {
    // define a payload
    const payload = {
      employee_role_id: employee.data.company_role_id,
      employee_id: employee.data.employee_id,
      employee_first_name: employee.data.employee_first_name,
    };
    // console.log(payload);
    
    // generate token
    const token = jwt.sign(payload, secret, { expiresIn: "24h" });
    // define a variable to store the token
    const result = {
      token: token,
      message: "Login successful",
      status: "success",
    };
    return res.status(200).send(result);
  }
};
// export the login function
module.exports = {
  login,
};
