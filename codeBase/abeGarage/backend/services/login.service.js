// import db config
const db = require('../config/db.config.js');
// import bcrypt
const bcrypt = require('bcrypt');
//  import employee service
const employeeService = require('./employee.service');
// create a new function to handle login
const login = async (body) => {
    try {
        let result = {}
        const employee = await employeeService.getEmployeeByEmail(body.employee_email);
        // console.log(employee);
        if(!employee){
            result.message = "Employee not found";
            result.status = "fail";
            return result;
        }
        const validPassword = await bcrypt.compare(body.employee_password, employee.employee_password_hashed);
        if(!validPassword){
            result.message = "Invalid Password";
            result.status = "fail";
            return result;
        }
        result.message = "Login successful";
        result.status = "success";
        result.data = employee
        return result;

    } catch (error) {
        console.log(error);
        return error;
    }
}
// export the login function
module.exports = {
    login
}