// TLS options for the database connection (config/dbSsl.js).
const { dbSsl } = require("../config/dbSsl");

test("TLS is off unless DB_SSL=true", () => {
  expect(dbSsl({})).toBeUndefined();
  expect(dbSsl({ DB_SSL: "false", DB_SSL_CA: "x" })).toBeUndefined();
});

test("DB_SSL=true always verifies the server certificate", () => {
  expect(dbSsl({ DB_SSL: "true" })).toEqual({ rejectUnauthorized: true });
});

test("a one-line CA with \\n escapes becomes a real multi-line PEM", () => {
  const ssl = dbSsl({ DB_SSL: "true", DB_SSL_CA: "-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----\\n" });
  expect(ssl).toEqual({ rejectUnauthorized: true, ca: "-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----\n" });
});
