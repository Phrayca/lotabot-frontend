// Client HTTP dedie a l'espace admin, separe de lib/api.ts (utilise par l'app client) :
// session admin (jeton) stockee sous une cle differente, pour ne jamais se melanger avec
// une session client ouverte dans le meme navigateur.

// Si le projet a deja une variable d'environnement pour l'URL du backend (ex :
// NEXT_PUBLIC_API_BASE), remplace la ligne ci-dessous par
// process.env.NEXT_PUBLIC_API_BASE ?? "https://lotabot-backend.onrender.com/api".
const API_BASE = "https://lotabot-backend.onrender.com/api";
const TOKEN_KEY = "lotabot_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

export async function adminApi<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) message = data.detail;
    } catch {
      // réponse sans JSON exploitable : on garde le message par défaut
    }
    if (res.status === 401) clearAdminToken();
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
