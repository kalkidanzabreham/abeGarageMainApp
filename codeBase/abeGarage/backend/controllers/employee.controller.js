// import service from '../services/employee.service.js';
const employeeService = require("../services/employee.service");

// define the addEmployee function
const addEmployee = async (req, res) => {
  // check if hte employee email exist or not
  const employeeExists = await employeeService.checkEmployeeExists(
    req.body.employee_email
  );
  // if the employee email exists, return an error message
  if (employeeExists) {
    return res.status(400).json({
      message: "Employee already exists",
    });
  }
  // if the employee email does not exist, add the employee
  else {
    try {
      const employee = await employeeService.addEmployee(req.body);
      //  if employee add successfully, return the employee details else return an error message
      if (employee) {
        return res.status(200).json({
          success: "true",
        });
      } else {
        return res.status(400).json({
          message: "Error adding employee",
        });
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
};
// a function to get all employees

const getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getAllEmployees();
    // console.log(employees);
    
    if (employees) {
      return res.status(200).json({
        success: "true",
        data: employees,
      });
    } else {
      return res.status(404).json({
        message: "No employees found",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// export the addEmployee function
module.exports = {
  addEmployee,
  getAllEmployees,
};
