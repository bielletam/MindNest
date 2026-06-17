"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { getCurrentUser, logout } from "@/lib/auth";
import type { BackendDocumentOut } from "@/lib/types";

const PALETTE = ["#8b5cf6", "#ec4899", "#06b6d4", "#22d3ee", "#22c55e", "#f59e0b"];

function docColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function DashboardPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<BackendDocumentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Student");
  const [userInitials, setUserInitials] = useState("ST");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u?.name) {
      setDisplayName(u.name);
      setUserInitials(
        u.name.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
      );
    }
    api.listDocuments()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) return;
    setUploading(true);
    try {
      const result = await api.uploadDocument(file);
      router.push(`/document/${result.id}/chat`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--mn-bg)", fontFamily: "var(--font-hanken), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid var(--mn-border)", background: "var(--mn-surface)" }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--mn-accent-grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 800 }}>
              {userInitials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{displayName}</span>
          </div>
          {/* Logout */}
          <button
            title="Sign out"
            onClick={async () => { await logout(); router.push("/login"); }}
            style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", color: "var(--mn-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.12)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
              <polyline points="12 6 15 9 12 12" />
              <line x1="15" y1="9" x2="6" y2="9" />
            </svg>
          </button>
          {/* Upload */}
          <input ref={uploadRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 12, background: uploading ? "#334155" : "var(--mn-accent-grad)", color: "#fff", fontSize: 13.5, fontWeight: 700, border: "none", cursor: uploading ? "not-allowed" : "pointer", boxShadow: uploading ? "none" : "0 3px 12px var(--mn-accent-ring)", fontFamily: "inherit" }}
          >
            {uploading ? "Uploading…" : "+ Upload PDF"}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", marginBottom: 6 }}>Your library</div>
        <div style={{ fontSize: 14, color: "var(--mn-text-3)", marginBottom: 32 }}>
          {loading ? "Loading…" : `${docs.length} document${docs.length !== 1 ? "s" : ""}`}
        </div>

        {loading ? (
          <div style={{ color: "var(--mn-text-3)", fontSize: 14 }}>Loading your documents…</div>
        ) : docs.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--mn-accent-soft)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>No documents yet</div>
            <div style={{ fontSize: 14, color: "var(--mn-text-3)", maxWidth: 320 }}>Upload a PDF to start studying smarter with AI-powered chat, summaries, and flashcards.</div>
            <button
              onClick={() => uploadRef.current?.click()}
              style={{ marginTop: 8, padding: "10px 24px", borderRadius: 12, background: "var(--mn-accent-grad)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 3px 12px var(--mn-accent-ring)", fontFamily: "inherit" }}
            >
              + Upload your first PDF
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {docs.map((doc) => {
              const color = docColor(doc.id);
              const name = doc.filename.replace(/\.pdf$/i, "");
              return (
                <Link key={doc.id} href={`/document/${doc.id}/chat`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ background: "var(--mn-surface)", border: "1px solid var(--mn-border)", borderRadius: 16, padding: "20px 20px 18px", cursor: "pointer", transition: "border-color .15s, background .15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--mn-border-2)"; (e.currentTarget as HTMLDivElement).style.background = "var(--mn-surface-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--mn-border)"; (e.currentTarget as HTMLDivElement).style.background = "var(--mn-surface)"; }}
                  >
                    <div style={{ width: 40, height: 48, borderRadius: 8, background: color + "26", border: `1px solid ${color}55`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, marginBottom: 14 }}>
                      <div style={{ width: 16, height: 3, borderRadius: 2, background: color }} />
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#e2e8f0", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--mn-text-3)", marginBottom: 14 }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{doc.status}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: color + "22", color }}>
                        {doc.status === "chunked" ? "Ready" : doc.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
