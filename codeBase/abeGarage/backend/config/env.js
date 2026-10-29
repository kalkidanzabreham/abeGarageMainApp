// Loads .env and validates every setting once, at startup.
// A missing or weak value stops the process with a clear message instead of
// failing later (e.g. an unset JWT_SECRET used to surface only at the first
// login, and an unset PORT made Express listen on a random port).
require("dotenv").config();
const { z } = require("zod");

const isProduction = process.env.NODE_ENV === "production";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string(), // may be empty for a local root user, but must be set
  DB_NAME: z.string().min(1),
  // HS256 secret: 32+ chars so it cannot be brute-forced from a captured token
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  // comma-separated list of allowed browser origins
  CORS_ORIGINS: isProduction
    ? z.string().min(1, "is required in production")
    : z.string().default("http://localhost:5173"),
  // number of reverse proxies in front of the app (Render/Heroku: 1);
  // needed so rate limiting sees the client IP, not the proxy's
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // failed login attempts allowed per IP per window
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOGIN_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example`);
}

const config = parsed.data;
config.CORS_ORIGINS = config.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

module.exports = Object.freeze(config);
