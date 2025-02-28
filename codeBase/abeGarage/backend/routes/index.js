// import routes
const express = require("express");
// import install route
const installRoute = require("./install.routes");
// use install route
const router = express.Router();
router.use(installRoute);
// import employee route
const employeeRoute = require("./employee.routes");
// use employee route
router.use(employeeRoute);
// import service route
const serviceRoute  = require('./service.routes')
// use service route
router.use(serviceRoute)
// import login route
const loginRoute = require("./login.routes");
// use login route
router.use(loginRoute);




// import the order router
const orderRouter = require("./order.routes");
// add the order router to the main router
router.use(orderRouter);


// import customer route
const customerRoute = require("./customer.routes");
// use customer route
router.use(customerRoute);
//  import vehicle route
const vehicleRoute = require("./vehicle.routes");
// use vehicle route
router.use(vehicleRoute);

// export router

module.exports = router;
