// An error with an HTTP status and a stable machine-readable code.
// Throw it anywhere in a request; the central error handler turns it into
// { status: "error", code, message, details? }.
class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const notFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);
const conflict = (message) => new AppError(409, "CONFLICT", message);
const badRequest = (message, details) =>
  new AppError(400, "BAD_REQUEST", message, details);

module.exports = { AppError, notFound, conflict, badRequest };
