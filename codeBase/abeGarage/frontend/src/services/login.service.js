const apiurl = import.meta.env.VITE_API_URL;
// create a login function to send the data to the server
const login = async (data) => {
  try {
    let endpoint = `${apiurl}/employee/login`; // Default for employee login

    // If logging in as a guest, change the endpoint
    if (data.role === "guest") {
      endpoint = `${apiurl}/guest-login`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Login request failed:", error);
    return { status: "error", message: "Login failed. Please try again." };
  }
};

const logout = () => {
  localStorage.removeItem("Our-token"); // redirect to login page
};
// export log
export { login, logout };
