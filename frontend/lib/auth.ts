export interface User {
  name: string;
  email: string;
}

const COOKIE = "mn_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function encode(user: User): string {
  return btoa(JSON.stringify(user));
}

function decode(raw: string): User | null {
  try {
    return JSON.parse(atob(raw)) as User;
  } catch {
    return null;
  }
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  if (!name.trim()) throw new Error("Full name is required.");
  if (!email.trim()) throw new Error("Email is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const user: User = { name: name.trim(), email: email.trim().toLowerCase() };
  document.cookie = `${COOKIE}=${encode(user)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  if (!email.trim()) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");

  // Mock: accept any credentials — replace with real API call later
  const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const user: User = { name, email: email.trim().toLowerCase() };
  document.cookie = `${COOKIE}=${encode(user)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  return user;
}

export function logout(): void {
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
}

export function getCurrentUser(): User | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return match ? decode(decodeURIComponent(match[1])) : null;
}
