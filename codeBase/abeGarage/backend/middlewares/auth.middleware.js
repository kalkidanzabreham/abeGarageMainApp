const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { ROLES } = require("../config/roles");
const { PERMISSIONS } = require("../config/permissions");
const { AppError } = require("../utils/AppError");

const KNOWN_ROLES = Object.values(ROLES);
const READ_METHODS = ["GET", "HEAD", "OPTIONS"];

// 401 = who are you? (missing, invalid or expired token)
// 403 = I know who you are, and you may not do this.
const authenticate = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return next(new AppError(401, "UNAUTHENTICATED", "No token provided"));
  }
  let payload;
  try {
    // pin the algorithm so a token can't choose how it is verified
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return next(
      new AppError(
        401,
        expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        expired ? "Token has expired" : "Invalid token"
      )
    );
  }
  // rejects tokens from the removed guest login (role "guest")
  if (!KNOWN_ROLES.includes(payload.employee_role_id)) {
    return next(new AppError(401, "INVALID_TOKEN", "Invalid token"));
  }
  req.user = {
    employee_id: payload.employee_id,
    role_id: payload.employee_role_id,
  };
  next();
};

// Second line of defence for the Demo role: even if a write route were
// added with a too-wide permission, Demo can never change data.
const denyDemoWrites = (req, res, next) => {
  if (req.user.role_id === ROLES.DEMO && !READ_METHODS.includes(req.method)) {
    return next(new AppError(403, "FORBIDDEN", "The demo account is read-only"));
  }
  next();
};

const authorize = (permission) => {
  const allowed = PERMISSIONS[permission];
  // fail at startup on a typo, not silently at request time
  if (!allowed) throw new Error(`Unknown permission: ${permission}`);
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHENTICATED", "No token provided"));
    }
    if (!allowed.includes(req.user.role_id)) {
      return next(
        new AppError(403, "FORBIDDEN", "You do not have permission to perform this action")
      );
    }
    next();
  };
};

module.exports = { authenticate, denyDemoWrites, authorize };
