"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth";
import {
  AuthButton,
  ErrorBanner,
  FieldLabel,
  GoogleButton,
  OrDivider,
  TextInput,
} from "./AuthCard";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      document.cookie = `mn_user=${encodeURIComponent(JSON.stringify({ name: user.name ?? user.email, email: user.email }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const from = searchParams.get("from") ?? "/document";
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>
          Welcome back
        </div>
        <div style={{ fontSize: 14, color: "var(--mn-text-2)" }}>
          Sign in to your MindNest workspace.
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <FieldLabel>Password</FieldLabel>
            <Link
              href="#"
              style={{ fontSize: 12.5, color: "var(--mn-accent)", textDecoration: "none", fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <TextInput
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--mn-text-3)", padding: 4, display: "flex", alignItems: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <AuthButton type="submit" loading={loading}>
          Sign in →
        </AuthButton>
      </form>

      <OrDivider />
      <GoogleButton />

      <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--mn-text-3)", marginTop: 20 }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "var(--mn-accent)", fontWeight: 600, textDecoration: "none" }}>
          Sign up free
        </Link>
      </div>
    </div>
  );
}
