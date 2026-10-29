// import bcrypt
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');
//  import employee service
const employeeService = require('./employee.service');
const { AppError, badRequest } = require('../utils/AppError');

// Compared against when the email is unknown, so "no such user" costs the
// same bcrypt work as "wrong password" and response timing doesn't reveal
// which emails exist. Generated once at startup from random bytes, with the
// same cost factor (10) as real password hashes.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

const invalidCredentials = () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

// Returns the employee on success; throws otherwise.
// Errors propagate to the error handler. The old version caught them and
// returned the Error object as if it were a result; the controller then
// read employee.data.company_role_id from it, threw outside any handler,
// and crashed the process (e.g. a request with no password).
const login = async (body) => {
    const { employee_email, employee_password } = body || {};
    if (typeof employee_email !== 'string' || typeof employee_password !== 'string') {
        throw badRequest('employee_email and employee_password are required');
    }
    const employee = await employeeService.getEmployeeByEmail(employee_email);
    const validPassword = await bcrypt.compare(
        employee_password,
        employee ? employee.employee_password_hashed : DUMMY_HASH
    );
    // same response for unknown email and wrong password (no user enumeration)
    if (!employee || !validPassword) {
        throw invalidCredentials();
    }
    // checked only after the password, so this doesn't reveal accounts either
    if (employee.active_employee !== 1) {
        throw new AppError(403, 'ACCOUNT_DISABLED', 'This account has been deactivated');
    }
    return employee;
}
// export the login function
module.exports = {
    login
}
