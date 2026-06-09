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

    throw new Error(
      data.message ||
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

export function searchGSTPractitioners(pincode) {
  return request(
    `/api/gstp/search?pincode=${encodeURIComponent(pincode)}`,
    {
      method: "GET",
    },
  );
}