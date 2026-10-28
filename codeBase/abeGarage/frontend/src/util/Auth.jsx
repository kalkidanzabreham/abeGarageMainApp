import { getToken, clearToken } from "../services/api";

// get the token from the local storage
// Returns the decoded payload (+ token) of a valid, unexpired token, or
// undefined. An expired token is removed so the UI shows the user as logged
// out instead of failing on every request. (The server still verifies the
// signature; decoding here is only for display and routing.)
const getAuth = async () => {
  const token = getToken();
  if (!token) return undefined;
  const employee = decodeToken(token);
  if (!employee || (employee.exp && employee.exp * 1000 <= Date.now())) {
    clearToken();
    return undefined;
  }
  employee.token = token;
  return employee;
};

// write a function to decode the payload from the token
// JWTs use base64url: '-' and '_' must be replaced EVERYWHERE (the old code
// used String.replace with a string, which only replaces the first one, so
// some tokens failed to decode) and the stripped '=' padding restored.
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
// export get auth
export { getAuth, decodeToken };
