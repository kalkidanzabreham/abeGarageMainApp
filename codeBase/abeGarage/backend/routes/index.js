// import routes
const express = require('express');
// import install route
const installRoute = require('./install.routes');
// use install route
const router = express.Router();
router.use(installRoute);
// import employee route
const employeeRoute = require('./employee.routes');
// use employee route
router.use(employeeRoute);
// import service route
const serviceRoute  = require('./service.routes')
// use service route
router.use(serviceRoute)
// import login route
const loginRoute = require('./login.routes');
// use login route
router.use(loginRoute);
module.exports = router;
