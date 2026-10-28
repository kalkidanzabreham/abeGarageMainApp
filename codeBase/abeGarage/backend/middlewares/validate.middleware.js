const { z } = require("zod");
const { AppError } = require("../utils/AppError");

// No query string is expected unless a route declares one, so unknown query
// parameters are rejected instead of silently ignored.
const NO_QUERY = z.object({}).strict();

// validate({ params, query, body }) checks each part with its zod schema.
// On success the parsed values REPLACE the originals: strings are coerced
// to numbers/dates and unknown keys are stripped, so controllers only ever
// see declared fields (no mass assignment). On failure: one 400 with every
// problem listed.
const validate = ({ params, query = NO_QUERY, body } = {}) => (req, res, next) => {
  const details = [];
  const parsed = {};
  for (const [location, schema] of Object.entries({ params, query, body })) {
    if (!schema) continue;
    const result = schema.safeParse(req[location] ?? {});
    if (result.success) {
      parsed[location] = result.data;
    } else {
      for (const issue of result.error.issues) {
        details.push({ location, path: issue.path.join("."), message: issue.message });
      }
    }
  }
  if (details.length > 0) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", details));
  }
  Object.assign(req, parsed);
  next();
};

module.exports = { validate };
