"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import {
  AuthButton,
  ErrorBanner,
  FieldLabel,
  GoogleButton,
  OrDivider,
  TextInput,
} from "./AuthCard";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signup(name, email, password);
      document.cookie = `mn_user=${encodeURIComponent(JSON.stringify({ name: user.name ?? name, email: user.email }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>
          Create your account
        </div>
        <div style={{ fontSize: 14, color: "var(--mn-text-2)" }}>
          Start studying smarter with AI.
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <FieldLabel>Full name</FieldLabel>
          <TextInput
            type="text"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

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
          <FieldLabel>Password</FieldLabel>
          <TextInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <AuthButton type="submit" loading={loading}>
          Create account →
        </AuthButton>
      </form>

      <OrDivider />
      <GoogleButton />

      <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--mn-text-3)", marginTop: 20 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--mn-accent)", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
