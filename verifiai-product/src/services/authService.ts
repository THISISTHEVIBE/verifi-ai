const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function getSession(): Promise<{ authenticated: boolean; user?: SessionUser | null }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: 'GET',
      headers: { 'accept': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return { authenticated: false };
    const data = await res.json();
    if (data && data.user) return { authenticated: true, user: data.user as SessionUser };
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export function getSignInUrl(provider?: 'github' | 'google') {
  const callback = encodeURIComponent(window.location.origin);
  if (provider) return `${API_BASE}/api/auth/signin/${provider}?callbackUrl=${callback}`;
  return `${API_BASE}/api/auth/signin?callbackUrl=${callback}`;
}

export function getSignOutUrl() {
  const callback = encodeURIComponent(window.location.origin);
  return `${API_BASE}/api/auth/signout?callbackUrl=${callback}`;
}
