export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Remove the hardcoded Content-Type from the initial spread
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Only add application/json if the payload is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  } else {
    // Ensure Content-Type is completely removed so the browser can generate the multipart boundary
    delete headers["Content-Type"];
  }

  const response = await fetch(`http://localhost:5000${endpoint}`, {
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
