import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mn-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <Logo />
      </div>

      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#f8fafc",
          textAlign: "center",
          maxWidth: 560,
          lineHeight: 1.15,
          marginBottom: 14,
        }}
      >
        Your AI-powered study companion
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "var(--mn-text-2)",
          textAlign: "center",
          maxWidth: 440,
          lineHeight: 1.6,
          marginBottom: 44,
        }}
      >
        Upload a document and ask questions, generate flashcards, take quizzes,
        and explore mind maps — all grounded in citations.
      </p>

      <UploadDropzone />

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <span style={{ fontSize: 13.5, color: "var(--mn-text-3)" }}>
          Or{" "}
          <Link
            href="/login"
            style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}
          >
            sign in to your library →
          </Link>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 56,
          maxWidth: 720,
        }}
      >
        {[
          { icon: "📄", label: "Summarize", desc: "Key passages highlighted" },
          { icon: "🃏", label: "Flashcards", desc: "Flip & study mode" },
          { icon: "🎯", label: "Quiz", desc: "Scored multiple choice" },
          { icon: "🗺️", label: "Mind map", desc: "Visual concept overview" },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              background: "var(--mn-surface)",
              border: "1px solid var(--mn-border)",
              borderRadius: 16,
              padding: "18px 22px",
              minWidth: 140,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--mn-text-3)" }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
