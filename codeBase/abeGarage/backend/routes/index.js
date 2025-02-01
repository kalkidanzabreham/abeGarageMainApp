// import routes
const express = require('express');
// import install route
const installRoute = require('./install.routes');
// use install route
const router = express.Router();
router.use(installRoute);
module.exports = router;
