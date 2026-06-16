"use client";

import { useRouter } from "next/navigation";
import { useDocContext } from "@/lib/document-context";

export function SummaryView({ docId }: { docId: string }) {
  const router = useRouter();
  const { activeDoc, openCite } = useDocContext();

  const highlights = (activeDoc.pages ?? []).flatMap((p) =>
    p.paras
      .filter((pa) => pa.hi)
      .map((pa) => ({ doc: activeDoc.id, page: p.n, hi: pa.hi!, text: pa.text }))
  );

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
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4l-5 5 5 5" /></svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>Summary</div>
          <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{activeDoc.title}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 26px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: activeDoc.color }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>{activeDoc.title}</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--mn-text-3)", marginBottom: 32 }}>{activeDoc.author}</div>

          {highlights.length === 0 ? (
            <div style={{ color: "var(--mn-text-2)", fontSize: 15 }}>No highlighted passages found in this document.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {highlights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--mn-surface-2)", borderRadius: 14,
                    padding: "18px 20px", border: "1px solid var(--mn-border-2)",
                    boxShadow: `inset 4px 0 0 ${activeDoc.color}`,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: 16, lineHeight: 1.7, color: "#dbe3ee", marginBottom: 12 }}>
                    "{h.text}"
                  </div>
                  <button
                    onClick={() => openCite({ doc: h.doc, page: h.page, hi: h.hi, snippet: h.text })}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: activeDoc.color + "22", border: `1px solid ${activeDoc.color}55`,
                      color: activeDoc.color, padding: "5px 12px", borderRadius: 999,
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: activeDoc.color }} />
                    {activeDoc.short} · p.{h.page}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
