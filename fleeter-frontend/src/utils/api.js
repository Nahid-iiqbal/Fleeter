export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Remove the hardcoded Content-Type from the initial spread
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

// Only add application/json if the payload is NOT FormData AND there is a body
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";

    // Auto-stringify JSON objects if Content-Type is application/json
    if (typeof options.body === 'object' && headers["Content-Type"] === "application/json") {
      options.body = JSON.stringify(options.body);
    }
  } else if (options.body instanceof FormData) {
    // Ensure Content-Type is completely removed so the browser can generate the multipart boundary
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    window.location.href = "/login";
    throw new Error("Session expired or invalid. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `HTTP Error: ${response.status}`,
    );
  }

  return data;
};
