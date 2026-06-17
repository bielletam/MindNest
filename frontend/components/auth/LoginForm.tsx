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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      document.cookie = `mn_user=${encodeURIComponent(JSON.stringify({ name: user.name ?? user.email, email: user.email }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const from = searchParams.get("from") ?? "/dashboard";
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
          <TextInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
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
