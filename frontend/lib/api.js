const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export const labers = {
  register: (body) => api("/api/labers/register", { method: "POST", body }),
  login: (body) => api("/api/labers/login", { method: "POST", body }),
  employee: (id) => api(`/api/labers/employee/${id}`),
  list: () => api("/api/labers/", { auth: true }),
  get: (id) => api(`/api/labers/${id}`, { auth: true }),
  update: (id, body) =>
    api(`/api/labers/${id}`, { method: "PUT", body, auth: true }),
  remove: (id) =>
    api(`/api/labers/${id}`, { method: "DELETE", auth: true }),
};

export const laborerData = {
  create: (body) =>
    api("/api/labers/laborers", { method: "POST", body }),
  list: () => api("/api/labers/laborers"),
  analysis: (laborersId) =>
    api(`/api/labers/analysis/${laborersId}`, { auth: true }),
};

export const supervisor = {
  list: () => api("/api/supervisor/supervisor", { auth: true }),
  get: (id) => api(`/api/supervisor/supervisor/${id}`, { auth: true }),
  create: (body) =>
    api("/api/supervisor/supervisor", { method: "POST", body, auth: true }),
  update: (id, body) =>
    api(`/api/supervisor/supervisor/${id}`, {
      method: "PUT",
      body,
      auth: true,
    }),
  remove: (id) =>
    api(`/api/supervisor/supervisor/${id}`, { method: "DELETE", auth: true }),
};
