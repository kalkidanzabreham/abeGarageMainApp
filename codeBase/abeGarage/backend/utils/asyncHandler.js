// Express 4 does not catch rejected promises from async handlers: the
// request hangs, and on Node >= 15 the unhandled rejection kills the
// process. This forwards any rejection to next(), i.e. the error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Wrap every function exported by a controller module.
const wrapAll = (controller) =>
  Object.fromEntries(
    Object.entries(controller).map(([name, fn]) => [name, asyncHandler(fn)])
  );

module.exports = { asyncHandler, wrapAll };
