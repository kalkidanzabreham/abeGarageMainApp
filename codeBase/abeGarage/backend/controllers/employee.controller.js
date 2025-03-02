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

// Create the getSingleEmployee controller
async function getSingleEmployee(req, res, next) {
	const employeeId = req.params.id;

	try {
		// Call the employee service to get the employee by ID
		const employee = await employeeService.getSingleEmployee(employeeId);

		if (!employee) {
			return res.status(404).json({
				status: "error",
				message: "Employee not found",
			});
		}
		// Send back the successful response with the employee data
		return res.status(200).json({
			status: "success",
			data: employee,
		});
	} catch (error) {
		// If there is an error in the try block, send a 500 status with the error message
		console.error("Error fetching employee:", error);
		return res.status(500).json({
			status: "error",
			message: "Failed to get employee. Please try again later.",
		});
	}
}

// Create the updateEmployee controller
const updateEmployee = async (req, res) => {
	try {
		const employeeId = req.params.id; // Get employee ID from the URL params
		const updatedEmployee = await employeeService.updateEmployee(
			employeeId,
			req.body // Pass the data from the request body
		);

		if (!updatedEmployee) {
			// Return 404 if employee not found
			return res.status(404).json({
				error: "Employee does not exist",
			});
		}

		// Return success response with the updated employee data
		res.status(200).json({
			success: true, // More standard response
			employee: updatedEmployee,
		});
	} catch (error) {
		// Handle unexpected errors
		console.error(error);
		res.status(500).json({
			error: "Internal Server Error",
		});
	}
};
const deleteEmployee = async (req, res) => {
  try {
    const employee_id = req.params.id;

    // Delete the employee
    const isDeleted = await employeeService.deleteEmployee(employee_id);

    if (isDeleted) {
      return res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } else {
      return res.status(400).json({
        message: "Error deleting employee",
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
  getSingleEmployee,
  updateEmployee,
  deleteEmployee
};
