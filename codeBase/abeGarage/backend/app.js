// import express from 'express';
const express = require('express');
// import dotenv from 'dotenv';
const dotenv = require('dotenv');
// configure dotenv
dotenv.config();
// import routes
const routes = require('./routes');
// create express app
const app = express();
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
const PORT = process.env.PORT;
// listen only when run directly (node app.js); tests import the app instead
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
// export the app
module.exports = app;
