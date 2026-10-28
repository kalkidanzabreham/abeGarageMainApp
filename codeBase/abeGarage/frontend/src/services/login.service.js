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

const logout = () => {
  clearToken();
};
// export log
export { login, logout };
