// import bcrypt
const bcrypt = require('bcrypt');
//  import employee service
const employeeService = require('./employee.service');
const { badRequest } = require('../utils/AppError');
// create a new function to handle login
// Errors propagate to the error handler. The old version caught them and
// returned the Error object as if it were a result; the controller then
// read employee.data.company_role_id from it, threw outside any handler,
// and crashed the process (e.g. a request with no password).
const login = async (body) => {
    const { employee_email, employee_password } = body || {};
    if (typeof employee_email !== 'string' || typeof employee_password !== 'string') {
        throw badRequest('employee_email and employee_password are required');
    }
    let result = {}
    const employee = await employeeService.getEmployeeByEmail(employee_email);
    if(!employee){
        result.message = "Employee not found";
        result.status = "fail";
        return result;
    }
    const validPassword = await bcrypt.compare(employee_password, employee.employee_password_hashed);
    if(!validPassword){
        result.message = "Invalid Password";
        result.status = "fail";
        return result;
    }
    result.message = "Login successful";
    result.status = "success";
    result.data = employee
    return result;
}
// export the login function
module.exports = {
    login
}
