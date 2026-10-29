// One place that talks to the API: adds the base URL, JSON headers and the
// logged-in user's token. Several services used to omit the token, so their
// requests were rejected once the API required authentication.
const API_URL = import.meta.env.VITE_API_URL;
export const TOKEN_KEY = "Our-token";

export const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY));
  } catch {
    return null;
  }
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Returns the fetch Response, like fetch().
// On 401 with a stored token (expired/invalid session) the token is cleared
// and the user is sent to /login. Without a stored token there is no session
// to end, so public pages are never redirected. Pass { auth: false } for requests that must not
// carry a token or trigger that redirect (the login request itself).
export const apiFetch = async (path, { auth = true, headers, ...options } = {}) => {
  const token = auth ? getToken() : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-access-token": token } : {}),
      ...headers,
    },
  });
  if (token && response.status === 401) {
    clearToken();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  return response;
};

// "/customers" + { page: 2, q: "" } -> "/customers?page=2" (empty values dropped)
export const withQuery = (path, params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const qs = new URLSearchParams(entries).toString();
  return qs ? `${path}?${qs}` : path;
};
