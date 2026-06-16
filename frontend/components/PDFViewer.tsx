"use client";

import { useEffect, useState } from "react";
import { useDocContext } from "@/lib/document-context";
import { api } from "@/lib/api";
import type { PageContent } from "@/lib/types";

export function PDFViewer() {
  const { state, activeDoc, dispatch } = useDocContext();
  const [pageData, setPageData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch page whenever the active document or page number changes.
  // The `ignore` flag prevents a stale fetch from overwriting a newer one.
  useEffect(() => {
    if (!state.showViewer || !activeDoc?.id) return;

    let ignore = false;

    setLoading(true);
    setError(null);
    setPageData(null);

    api
      .fetchPage(activeDoc.id, state.viewerPage)
      .then((data) => {
        if (!ignore) { setPageData(data); setLoading(false); }
      })
      .catch((err: Error) => {
        if (!ignore) {
          setError(
            err.message.includes("404")
              ? "This page is not available in the extracted text."
              : "Could not load page content. Is the backend running?"
          );
          setLoading(false);
        }
      });

    return () => { ignore = true; };
  }, [activeDoc?.id, state.viewerPage, state.showViewer]);

  if (!state.showViewer) return null;

  const totalPages = pageData?.total_pages ?? 0;

  function goToPage(n: number) {
    if (n < 1 || (totalPages > 0 && n > totalPages)) return;
    dispatch({ type: "SET_VIEWER_PAGE", payload: n });
  }

  return (
    <aside
      style={{
        width: 402,
        flexShrink: 0,
        background: "var(--mn-surface)",
        border: "1px solid var(--mn-border)",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--mn-border)",
          display: "flex",
          flexDirection: "column",
          gap: 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: activeDoc.color + "26", color: activeDoc.color,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="10" height="12" rx="2" />
                <line x1="6.5" y1="7" x2="11.5" y2="7" />
                <line x1="6.5" y1="10" x2="11.5" y2="10" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                title={activeDoc.title}
                style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f1f5f9" }}
              >
                {activeDoc.title}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--mn-text-2)" }}>{activeDoc.author}</div>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: "SHOW_VIEWER", payload: false })}
            title="Hide panel"
            style={{
              flexShrink: 0, width: 29, height: 29, borderRadius: 10,
              border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)",
              color: "var(--mn-text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 5l8 8" /><path d="M13 5l-8 8" />
            </svg>
          </button>
        </div>

        {/* Page controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>
            PDF preview
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <button
              onClick={() => goToPage(state.viewerPage - 1)}
              disabled={state.viewerPage <= 1}
              style={{
                width: 28, height: 28, borderRadius: 9, border: "1px solid var(--mn-border-2)",
                background: "var(--mn-surface-2)", color: "var(--mn-text-2)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                opacity: state.viewerPage <= 1 ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5l-3.5 4 3.5 4" />
              </svg>
            </button>
            <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 90, textAlign: "center", color: "#cbd5e1" }}>
              {totalPages > 0 ? `Page ${state.viewerPage} / ${totalPages}` : `Page ${state.viewerPage}`}
            </span>
            <button
              onClick={() => goToPage(state.viewerPage + 1)}
              disabled={totalPages > 0 && state.viewerPage >= totalPages}
              style={{
                width: 28, height: 28, borderRadius: 9, border: "1px solid var(--mn-border-2)",
                background: "var(--mn-surface-2)", color: "var(--mn-text-2)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                opacity: totalPages > 0 && state.viewerPage >= totalPages ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 5l3.5 4-3.5 4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto", padding: "18px 20px 44px" }}>
        <div
          style={{
            background: "#1a2336", border: "1px solid var(--mn-border)", borderRadius: 12,
            boxShadow: "0 6px 20px rgba(0,0,0,.25)", padding: "30px 30px 32px",
          }}
        >
          <div
            style={{
              fontSize: 10.5, color: "var(--mn-text-3)", fontWeight: 600,
              letterSpacing: ".06em", marginBottom: 18,
              display: "flex", justifyContent: "space-between", textTransform: "uppercase",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
              {activeDoc.title}
            </span>
            <span>Page {state.viewerPage}</span>
          </div>

          {loading && (
            <div style={{ display: "flex", gap: 5, padding: "12px 0" }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <span
                  key={i}
                  className="animate-blink"
                  style={{ width: 7, height: 7, borderRadius: "50%", background: "#5b6678", animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          )}

          {error && !loading && (
            <p style={{ fontSize: 13.5, color: "#f87171", lineHeight: 1.6, margin: 0 }}>
              {error}
            </p>
          )}

          {pageData && !loading && (
            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: 15.5, lineHeight: 1.74, color: "#c3cdda",
                margin: 0, whiteSpace: "pre-wrap",
              }}
            >
              {pageData.content}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
