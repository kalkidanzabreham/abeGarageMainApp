// import express from 'express';
const express = require('express');
// load and validate environment first; throws if anything is missing
const env = require('./config/env');
// import routes
const routes = require('./routes');
// create express app
const app = express();
// request logging first, so every response (including errors) is logged
const { logger, createHttpLogger } = require('./utils/logger');
app.use(createHttpLogger());
// number of proxies to trust for the client IP (rate limiting); 0 locally
app.set('trust proxy', env.TRUST_PROXY);
// security headers (also removes X-Powered-By)
const helmet = require('helmet');
app.use(helmet());
// CORS: only the configured frontend origins may call the API from a
// browser (was cors() with no options = any origin). Requests without an
// Origin header (curl, server-to-server) are not affected by CORS; the
// JWT check is what protects the API.
const cors = require('cors');
app.use(cors({
    origin: env.CORS_ORIGINS,
    allowedHeaders: ['Content-Type', 'x-access-token'],
}));
// use express.json (explicit body size cap)
app.use(express.json({ limit: '100kb' }));

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
        logger.info({ port: PORT }, `Server is running on port ${PORT}`);
    });
}
// export the app
module.exports = app;
