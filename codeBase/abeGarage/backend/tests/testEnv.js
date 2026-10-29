// Environment for the test run. Applied before any app module is loaded, so
// these values win over backend/.env (dotenv never overrides existing vars).
// The database connection can be pointed elsewhere with TEST_DB_* variables;
// the defaults match the MySQL service container in CI.
const applyTestEnv = () => {
  const values = {
    NODE_ENV: "test",
    DB_HOST: process.env.TEST_DB_HOST || "127.0.0.1",
    DB_PORT: process.env.TEST_DB_PORT || "3306",
    DB_USER: process.env.TEST_DB_USER || "root",
    DB_PASS: process.env.TEST_DB_PASS ?? "root",
    DB_NAME: process.env.TEST_DB_NAME || "garagehub_test",
    JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGINS: "http://localhost:5173",
    // high so tests that log in a lot are not throttled; the rate-limit test
    // loads its own copy of the app with a low limit
    LOGIN_RATE_LIMIT_MAX: "1000",
  };
  // safety net: the test setup drops and recreates this database
  if (!values.DB_NAME.endsWith("_test")) {
    throw new Error(`Refusing to run tests against "${values.DB_NAME}": name must end with _test`);
  }
  Object.assign(process.env, values);
  return values;
};

module.exports = { applyTestEnv };
