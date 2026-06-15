const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text || "Invalid response received from the server",
    };
  }

  if (!response.ok) {
  console.error("Backend error response:", data);

  if (response.status === 500) {
    throw new Error("No records found");
  }

  throw new Error(
    data.message ||
      data.error ||
      data.error?.message ||
      `Request failed with status ${response.status}`,
  );
}

  return data;
}

export function signupUser(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchGSTPractitioners(filters) {
  const params = new URLSearchParams();

  if (filters.name) params.append("name", filters.name);
  if (filters.state) params.append("state", filters.state);
  if (filters.district) params.append("district", filters.district);
  if (filters.pincode) params.append("pincode", filters.pincode);

  return request(`/api/gstp/search?${params.toString()}`, {
    method: "GET",
  });
}
export function getCountriesStates() {
  return request("/api/location/states", {
    method: "GET",
  });
}