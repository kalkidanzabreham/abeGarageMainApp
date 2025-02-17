// import the query function from the database configuration file
const query = require("../config/db.config");
// import the bcrypt module
const bcrypt = require("bcrypt");

// define the checkEmployeeExists function
const checkEmployeeExists = async (employee_email) => {
  // define the query
  const sql = "SELECT * FROM employee WHERE employee_email = ?";
  // execute the query
  const result = await query(sql, [employee_email]);
  // return true if the employee exists, else return false
  if (result.length > 0) {
    return true;
  } else {
    return false;
  }
};
// defne the addEmployee function
const addEmployee = async (employee) => {
  try {
    // generate salt
    const salt = await bcrypt.genSalt(10);
    // hash the employee password
    const hashedPassword = await bcrypt.hash(employee.employee_password, salt);
    // define the query
    const sql =
      "INSERT INTO employee (employee_email,active_employee) VALUES (?, ?)";
    // execute the query
    const result = await query(sql, [
      employee.employee_email,
      employee.active_employee,
    ]);
    console.log(result);

    if (result.affectedRows !== 1) {
      return false;
    }
    const employee_id = result.insertId;
    // insert the reamining inforamtion to employee_info table, employee_pass tables , employee_role tables separetly
    const sql2 =
      "INSERT INTO employee_info (employee_id, employee_first_name, employee_last_name, employee_phone) VALUES (?, ?, ?, ?)";
    const result2 = await query(sql2, [
      employee_id,
      employee.employee_first_name,
      employee.employee_last_name,
      employee.employee_phone,
    ]);
    if (result2.affectedRows !== 1) {
      console.log("Error in inserting employee info");

      return false;
    }
    const sql3 =
      "INSERT INTO employee_pass (employee_id, employee_password_hashed) VALUES (?, ?)";
    const result3 = await query(sql3, [employee_id, hashedPassword]);
    if (result3.affectedRows !== 1) {
      console.log("Error in inserting employee pass");
      return false;
    }
    const sql4 =
      "INSERT INTO employee_role (employee_id,company_role_id) VALUES (?, ?)";
    const result4 = await query(sql4, [employee_id, employee.company_role_id]);
    if (result4.affectedRows !== 1) {
      console.log("Error in inserting employee role");
      return false;
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// get employee by email
const getEmployeeByEmail = async (employee_email) => {
  // define the query to fetch data from the employee table,employee_info table, employee_pass table, employee_role table using join query using employee_email
  const sql = `SELECT employee.employee_id, employee.employee_email, employee.active_employee, employee_info.employee_first_name, employee_info.employee_last_name, employee_info.employee_phone, employee_pass.employee_password_hashed, employee_role.company_role_id FROM employee JOIN employee_info ON employee.employee_id = employee_info.employee_id JOIN employee_pass ON employee.employee_id = employee_pass.employee_id JOIN employee_role ON employee.employee_id = employee_role.employee_id WHERE employee.employee_email = ?`;

  // execute the query
  const result = await query(sql, [employee_email]);
  // console.log(result);
  // return the employee
  return result[0];
};

// a functio to get all employees from the database

const getAllEmployees = async () => {
  const sql = "SELECT * FROM employee JOIN employee_info ON employee.employee_id = employee_info.employee_id JOIN employee_role ON employee.employee_id = employee_role.employee_id JOIN company_roles ON employee_role.company_role_id = company_roles.company_role_id ORDER BY employee.employee_id DESC LIMIT 10";
  const result = await query(sql);
  return result;
 
};
// export the functions
module.exports = { checkEmployeeExists, addEmployee,getEmployeeByEmail, getAllEmployees };
