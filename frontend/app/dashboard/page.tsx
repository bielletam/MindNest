"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { seedDocs } from "@/lib/seed-data";

export default function DashboardPage() {
  const docs = seedDocs();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mn-bg)",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid var(--mn-border)",
          background: "var(--mn-surface)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 12,
            background: "var(--mn-accent-grad)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 3px 12px var(--mn-accent-ring)",
          }}
        >
          + Upload PDF
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", marginBottom: 6 }}>
          Your library
        </div>
        <div style={{ fontSize: 14, color: "var(--mn-text-3)", marginBottom: 32 }}>
          {docs.length} documents
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/document/${doc.id}/chat`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--mn-surface)",
                  border: "1px solid var(--mn-border)",
                  borderRadius: 16,
                  padding: "20px 20px 18px",
                  cursor: "pointer",
                  transition: "border-color .15s, background .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--mn-border-2)";
                  (e.currentTarget as HTMLDivElement).style.background = "var(--mn-surface-2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--mn-border)";
                  (e.currentTarget as HTMLDivElement).style.background = "var(--mn-surface)";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 48,
                    borderRadius: 8,
                    background: doc.color + "26",
                    border: `1px solid ${doc.color}55`,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 6,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 3,
                      borderRadius: 2,
                      background: doc.color,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "#e2e8f0",
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--mn-text-3)", marginBottom: 14 }}>
                  {doc.author}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>
                    {doc.pages?.length ?? 0} pages
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: doc.color + "22",
                      color: doc.color,
                    }}
                  >
                    Ready
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
