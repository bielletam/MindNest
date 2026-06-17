const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface User {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
}

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = (data as { detail?: string } | null)?.detail;
    throw new Error(detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  return authRequest<User>("/api/v1/auth/signup", { name, email, password });
}

export async function login(email: string, password: string): Promise<User> {
  return authRequest<User>("/api/v1/auth/login", { email, password });
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (typeof document !== "undefined") {
    document.cookie = "mn_user=; path=/; max-age=0";
  }
}

export async function getMe(): Promise<User | null> {
  const res = await fetch(`${BASE}/api/v1/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json() as Promise<User>;
}

// Kept for sidebar display — reads the non-httpOnly mn_user cookie set by login pages.
export function getCurrentUser(): { name: string; email: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )mn_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as { name: string; email: string };
  } catch {
    return null;
  }
}
