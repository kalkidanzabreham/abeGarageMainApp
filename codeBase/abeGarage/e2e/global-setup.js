// Fresh demo data before every run: same accounts, services and orders.
const { execSync } = require("node:child_process");
const path = require("node:path");

module.exports = async () => {
  execSync("npm run seed", { cwd: path.join(__dirname, "../backend"), stdio: "inherit" });
};
