"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/Logo";

export function AuthCard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mn-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--mn-surface)",
          border: "1px solid var(--mn-border-2)",
          borderRadius: 22,
          padding: "36px 32px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,.45)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            marginBottom: 26,
          }}
        >
          <LogoMark width={46} height={48} />
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            Mind<span style={{ fontWeight: 800 }}>Nest</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,.25)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}
        >
          <Link
            href="/login"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px 0",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background .18s, color .18s",
              background: isLogin ? "var(--mn-surface-3)" : "transparent",
              color: isLogin ? "#f1f5f9" : "var(--mn-text-3)",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px 0",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background .18s, color .18s",
              background: !isLogin ? "var(--mn-surface-3)" : "transparent",
              color: !isLogin ? "#f1f5f9" : "var(--mn-text-3)",
            }}
          >
            Create account
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}

// ── Shared field atoms ─────────────────────────────────────────────────────────

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".09em",
        textTransform: "uppercase",
        color: "var(--mn-text-3)",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        background: "var(--mn-surface-2)",
        border: "1px solid var(--mn-border-2)",
        borderRadius: 12,
        padding: "13px 14px",
        fontSize: 15,
        color: "#f1f5f9",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        outline: "none",
        transition: "border-color .15s",
        boxSizing: "border-box",
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--mn-accent)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--mn-border-2)";
        props.onBlur?.(e);
      }}
    />
  );
}

export function AuthButton({
  children,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading ?? rest.disabled}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 12,
        border: "none",
        background: "var(--mn-accent-grad)",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 4px 16px var(--mn-accent-ring)",
        transition: "opacity .15s, filter .15s",
        marginTop: 6,
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "20px 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "var(--mn-border)" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mn-text-3)", letterSpacing: ".06em" }}>
        OR
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--mn-border)" }} />
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "13px",
        borderRadius: 12,
        border: "1px solid var(--mn-border-2)",
        background: "var(--mn-surface-2)",
        color: "#cbd5e1",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        cursor: "pointer",
      }}
    >
      {/* Google G */}
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,.12)",
        border: "1px solid rgba(239,68,68,.3)",
        borderRadius: 10,
        padding: "11px 14px",
        fontSize: 13.5,
        color: "#fca5a5",
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
}
