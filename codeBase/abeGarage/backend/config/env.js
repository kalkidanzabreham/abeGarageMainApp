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
  // TLS to the database (see config/dbSsl.js)
  DB_SSL: z.enum(["true", "false"]).default("false"),
  DB_SSL_CA: z.string().optional(),
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
  // Smart job intake (AI drafts a job card; see ai/). Off unless enabled.
  AI_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  // fake: no model, for tests; gemini: hosted (needs GEMINI_API_KEY);
  // ollama: a local model at OLLAMA_URL
  AI_PROVIDER: z.enum(["fake", "gemini", "ollama"]).default("fake"),
  // empty: the provider's default (gemini-2.5-flash-lite, gemma3:4b)
  AI_MODEL: z.string().optional(),
  // server-side only: never sent to the browser or written to logs
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().url().default("http://localhost:11434"),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(20000),
  AI_MAX_INPUT_CHARS: z.coerce.number().int().min(50).max(5000).default(1000),
  // all users together, per UTC day; when reached the feature pauses
  AI_DAILY_CAP: z.coerce.number().int().min(0).default(200),
  // per user: AI_USER_LIMIT requests per AI_USER_WINDOW_MIN minutes
  AI_USER_LIMIT: z.coerce.number().int().positive().default(10),
  AI_USER_WINDOW_MIN: z.coerce.number().int().positive().default(10),
  // all users together, per minute; 7 intakes = at most 14 model calls,
  // under Gemini free tier's 15/minute (see .env.example)
  AI_GLOBAL_RPM: z.coerce.number().int().positive().default(7),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default(
    process.env.NODE_ENV === "test" ? "silent" : "info"
  ),
}).superRefine((c, ctx) => {
  if (c.AI_ENABLED && c.AI_PROVIDER === "gemini" && !c.GEMINI_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["GEMINI_API_KEY"], message: "is required when AI_PROVIDER=gemini" });
  }
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
