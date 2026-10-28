// import express from 'express';
const express = require('express');
// load and validate environment first; throws if anything is missing
const env = require('./config/env');
// import routes
const routes = require('./routes');
// create express app
const app = express();
// number of proxies to trust for the client IP (rate limiting); 0 locally
app.set('trust proxy', env.TRUST_PROXY);
// use cors
const cors = require('cors');
app.use(cors());
// use express.json
app.use(express.json());

// use routes
app.use(routes);
// unknown routes -> JSON 404; every error -> one JSON shape (see middleware)
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");
app.use(notFoundHandler);
app.use(errorHandler);


// define port
const PORT = env.PORT;
// listen only when run directly (node app.js); tests import the app instead
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
// export the app
module.exports = app;
