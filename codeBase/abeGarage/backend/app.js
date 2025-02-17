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


// define port
const PORT = process.env.PORT;
// listen to port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// export the app
