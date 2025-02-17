const jwt = require('jsonwebtoken');
require('dotenv').config();
const verifyToken = (req, res, next) => {
    
    const token = req.headers['x-access-token'];
    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.employee_role_id = user.employee_role_id;
        next();
    });
}

const verifyAdmin = (req, res, next) => {
    if (req.employee_role_id !== 3) {
        return res.status(403).json({ message: 'Access denied, you are not an admin' });
    }
    next();
}



module.exports = {
    verifyToken,
    verifyAdmin
}