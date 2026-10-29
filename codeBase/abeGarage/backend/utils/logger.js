// Structured JSON logging (pino). One line per request with a request id,
// method, path, status and duration.
// Deliberately NOT logged: headers (x-access-token), request bodies
// (passwords) and query strings (search terms can be customer names).
const { randomUUID } = require("node:crypto");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { LOG_LEVEL } = require("../config/env");

const createLogger = (destination, level = LOG_LEVEL) => pino({ level }, destination);

const logger = createLogger();

// accept a caller's id (e.g. from a load balancer) only if it looks sane
const REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

const createHttpLogger = (log = logger) =>
  pinoHttp({
    logger: log,
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id = typeof incoming === "string" && REQUEST_ID.test(incoming) ? incoming : randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    // replace the default serializers, which include all headers
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, path: req.url.split("?")[0] }),
      res: (res) => ({ statusCode: res.statusCode }),
      err: pino.stdSerializers.err,
    },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url.split("?")[0]} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url.split("?")[0]} ${res.statusCode}`,
    // pino-http adds responseTime (ms) to the completion line
  });

module.exports = { logger, createLogger, createHttpLogger };
