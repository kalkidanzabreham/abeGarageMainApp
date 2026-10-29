// TLS options for the MySQL connection (managed MySQL services such as
// Aiven require encrypted connections).
//   DB_SSL=true     encrypt the connection and verify the server certificate
//   DB_SSL_CA=...   the provider's CA certificate (PEM). Newlines may be
//                   written as \n so it fits in one env var. Without it,
//                   Node's built-in public CAs are used.
// There is deliberately no option to skip certificate verification.
const dbSsl = (env = process.env) => {
  if (env.DB_SSL !== "true") return undefined;
  const ca = env.DB_SSL_CA ? env.DB_SSL_CA.replace(/\\n/g, "\n") : undefined;
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
};

module.exports = { dbSsl };
