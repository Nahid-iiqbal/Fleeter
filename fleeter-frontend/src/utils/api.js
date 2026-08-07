// A reusable fetch wrapper that automatically attaches the JWT
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`http://localhost:5000${endpoint}`, {
    ...options,
    headers,
  });

  // Automatically handle 401 Unauthorized (e.g., token expired)
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};
