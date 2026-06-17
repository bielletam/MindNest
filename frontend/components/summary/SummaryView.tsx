"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocContext } from "@/lib/document-context";
import { api } from "@/lib/api";
import type { SummaryLength } from "@/lib/types";

const LENGTHS: { key: SummaryLength; label: string }[] = [
  { key: "short", label: "Short" },
  { key: "medium", label: "Medium" },
  { key: "detailed", label: "Detailed" },
];

export function SummaryView({ docId }: { docId: string }) {
  const router = useRouter();
  const { activeDoc } = useDocContext();

  const [length, setLength] = useState<SummaryLength>("medium");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Client-side cache: avoid re-fetching a length already loaded this session.
  const cache = useRef<Map<SummaryLength, string>>(new Map());

  useEffect(() => {
    const hit = cache.current.get(length);
    if (hit) {
      setSummary(hit);
      setError("");
      return;
    }

    let ignore = false;
    setLoading(true);
    setError("");
    setSummary("");

    api
      .fetchSummary(docId, length)
      .then((res) => {
        if (ignore) return;
        cache.current.set(length, res.summary);
        setSummary(res.summary);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Failed to load summary.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [docId, length]);

  const color = activeDoc?.color ?? "#8b5cf6";
  const title = activeDoc?.title ?? docId;

  return (
    <main
      style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 18, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", gap: 12, padding: "0 18px" }}>
        <button
          onClick={() => router.push(`/document/${docId}/chat`)}
          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4l-5 5 5 5" />
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>Summary</div>
          <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{title}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 26px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Document title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>{title}</div>
          </div>
          {activeDoc?.author && (
            <div style={{ fontSize: 13, color: "var(--mn-text-3)", marginBottom: 28 }}>
              {activeDoc.author}
            </div>
          )}

          {/* Length toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
            {LENGTHS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLength(l.key)}
                style={{
                  padding: "7px 20px", borderRadius: 999, border: "none",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "background .15s, box-shadow .15s",
                  background: length === l.key ? "var(--mn-accent-grad)" : "var(--mn-surface-2)",
                  color: length === l.key ? "#fff" : "var(--mn-text-2)",
                  boxShadow: length === l.key ? "0 3px 10px var(--mn-accent-ring)" : "none",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Body states */}
          {loading ? (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {[100, 93, 97, 88, 75, 91, 60].map((w, i) => (
                  <div
                    key={i}
                    style={{ height: 15, borderRadius: 6, background: "var(--mn-surface-2)", width: `${w}%`, opacity: 0.55 }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--mn-text-3)" }}>Generating summary…</div>
            </div>
          ) : error ? (
            <div
              style={{
                background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14, lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          ) : summary ? (
            <div
              style={{
                background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)",
                borderRadius: 14, padding: "24px 28px",
                boxShadow: `inset 4px 0 0 ${color}`,
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: 16.5, lineHeight: 1.78, color: "#dbe3ee",
                whiteSpace: "pre-wrap",
              }}
            >
              {summary}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
