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
// import login route
const loginRoute = require('./login.routes');
// use login route
router.use(loginRoute);



// import the order router
const orderRouter = require("./order.routes");
// add the order router to the main router
router.use("/",orderRouter);

module.exports = router;
