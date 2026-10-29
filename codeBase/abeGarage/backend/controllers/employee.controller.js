// import service from '../services/employee.service.js';
const employeeService = require("../services/employee.service");
const { notFound, conflict } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");
const { paginationMeta } = require("../utils/pagination");

// Errors are thrown and handled by middlewares/error.middleware.js

// define the addEmployee function
const addEmployee = async (req, res) => {
  // check if hte employee email exist or not
  const employeeExists = await employeeService.checkEmployeeExists(
    req.body.employee_email
  );
  if (employeeExists) {
    throw conflict("Employee already exists");
  }
  await employeeService.addEmployee(req.body);
  return res.status(200).json({
    success: "true",
  });
};

// a function to get all employees
const getAllEmployees = async (req, res) => {
  const { rows, total } = await employeeService.getAllEmployees(req.query);
  return res.status(200).json({
    success: "true",
    data: rows,
    pagination: paginationMeta(req.query, total),
  });
};

// Create the getSingleEmployee controller
const getSingleEmployee = async (req, res) => {
  const employee = await employeeService.getSingleEmployee(req.params.id);
  if (!employee) {
    throw notFound("Employee not found");
  }
  return res.status(200).json({
    status: "success",
    data: employee,
  });
};

// Create the updateEmployee controller
const updateEmployee = async (req, res) => {
  const updatedEmployee = await employeeService.updateEmployee(
    req.params.id,
    req.body
  );
  if (!updatedEmployee) {
    throw notFound("Employee does not exist");
  }
  res.status(200).json({
    success: true,
    employee: updatedEmployee,
  });
};

const deleteEmployee = async (req, res) => {
  const isDeleted = await employeeService.deleteEmployee(req.params.id);
  if (!isDeleted) {
    throw notFound("Employee does not exist");
  }
  return res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
  });
};

// export the addEmployee function
module.exports = wrapAll({
  addEmployee,
  getAllEmployees,
  getSingleEmployee,
  updateEmployee,
  deleteEmployee,
});
