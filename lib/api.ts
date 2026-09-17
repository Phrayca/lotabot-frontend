const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lotabot_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("lotabot_token", token);
  else localStorage.removeItem("lotabot_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

type ApiOptions = {
  method?: string;
  body?: unknown;
};

export async function api<T = any>(path: string, { method = "GET", body }: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // pas de corps JSON
  }
  if (!res.ok) {
    throw new Error(data.detail || data.error || "Une erreur est survenue");
  }
  return data as T;
}
