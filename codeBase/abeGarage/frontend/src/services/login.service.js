import { apiFetch, clearToken } from "./api";

// create a login function to send the data to the server
const login = async (data) => {
  try {
    const response = await apiFetch("/employee/login", {
      auth: false,
      method: "POST",
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Login request failed:", error);
    return { status: "error", message: "Login failed. Please try again." };
  }
};

// one-click login to the read-only Demo account (no password); the API only
// offers it when DEMO_LOGIN_ENABLED=true, otherwise this returns an error
const demoLogin = async () => {
  try {
    const response = await apiFetch("/employee/demo-login", { auth: false, method: "POST" });
    if (response.status === 404 || response.status === 401) {
      return { status: "error", message: "The demo is not available right now." };
    }
    return await response.json();
  } catch (error) {
    console.error("Demo login request failed:", error);
    return { status: "error", message: "Couldn't reach the demo. Please try again." };
  }
};

const logout = () => {
  clearToken();
};
// export log
export { login, demoLogin, logout };
