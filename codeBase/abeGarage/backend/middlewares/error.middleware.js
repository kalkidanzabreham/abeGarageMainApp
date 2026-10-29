const { AppError } = require("../utils/AppError");

// MySQL errors that are the client's fault, mapped to safe messages.
// Anything else becomes a generic 500; the raw SQL message is only logged.
const MYSQL_ERRORS = {
  ER_DUP_ENTRY: [409, "CONFLICT", "A record with these values already exists"],
  ER_ROW_IS_REFERENCED_2: [
    409,
    "CONFLICT",
    "This record is still referenced by other records",
  ],
  ER_NO_REFERENCED_ROW_2: [
    400,
    "BAD_REFERENCE",
    "A referenced record does not exist",
  ],
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";
  let details;

  if (err instanceof AppError) {
    ({ statusCode, code, message, details } = err);
  } else if (err.type === "entity.parse.failed") {
    // malformed JSON body from express.json()
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large";
  } else if (MYSQL_ERRORS[err.code]) {
    [statusCode, code, message] = MYSQL_ERRORS[err.code];
  }

  if (statusCode >= 500) {
    // full error with stack goes to the log (tagged with the request id),
    // never to the client
    req.log.error({ err }, "unhandled error");
  }

  const body = { status: "error", code, message };
  if (details) body.details = details;
  // stack traces only with an explicit NODE_ENV=development (read raw, not
  // from config/env where it defaults to development), so a deploy that
  // forgets NODE_ENV never leaks them
  if (process.env.NODE_ENV === "development") body.stack = err.stack;
  res.status(statusCode).json(body);
};

module.exports = { notFoundHandler, errorHandler };
