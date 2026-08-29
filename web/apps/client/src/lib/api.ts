const API_BASE = import.meta.env.VITE_API_URL || "";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("rathena_token");
  const adminKey = localStorage.getItem("rathena_admin_key");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }
  return headers;
}

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.error || json.message || text || res.statusText || `HTTP error ${res.status}`;
    } catch {
      return text || res.statusText || `HTTP error ${res.status}`;
    }
  } catch {
    return res.statusText || `HTTP error ${res.status}`;
  }
}

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res);
      throw new Error(errorMsg);
    }
    return res.json();
  },
};
