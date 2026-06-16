"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useDocContext } from "@/lib/document-context";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import type { MindNestDocument } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

const TOOLS = [
  {
    key: "summarize",
    label: "Summarize document",
    color: "rgba(99,102,241,.16)",
    iconColor: "#818cf8",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="5.5" x2="14" y2="5.5" />
        <line x1="4" y1="9" x2="14" y2="9" />
        <line x1="4" y1="12.5" x2="9.5" y2="12.5" />
      </svg>
    ),
  },
  {
    key: "flashcards",
    label: "Generate flashcards",
    color: "rgba(16,185,129,.16)",
    iconColor: "#34d399",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5.5" width="9" height="7.5" rx="1.5" />
        <rect x="6" y="3" width="9" height="7.5" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "quiz",
    label: "Generate quiz",
    color: "rgba(245,158,11,.16)",
    iconColor: "#fbbf24",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6" />
        <polyline points="6.3,9.2 8.1,11 11.4,7.2" />
      </svg>
    ),
  },
  {
    key: "mindmap",
    label: "Generate mind map",
    color: "rgba(59,130,246,.16)",
    iconColor: "#60a5fa",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="4.5" cy="9" r="2.2" />
        <circle cx="13" cy="4.8" r="1.8" />
        <circle cx="13" cy="13.2" r="1.8" />
        <line x1="6.5" y1="8" x2="11.3" y2="5.6" />
        <line x1="6.5" y1="10" x2="11.3" y2="12.4" />
      </svg>
    ),
  },
];

const PALETTE = ["#8b5cf6", "#ec4899", "#06b6d4", "#22d3ee"];

export function Sidebar({ docId }: { docId: string }) {
  const { state, dispatch, send, openFlashcards } = useDocContext();
  const router = useRouter();
  const uploadInput = useRef<HTMLInputElement>(null);

  function handleTool(key: string) {
    if (key === "flashcards") { openFlashcards(); router.push(`/document/${docId}/flashcards`); return; }
    if (key === "quiz") { router.push(`/document/${docId}/quiz`); return; }
    if (key === "mindmap") { router.push(`/document/${docId}/mindmap`); return; }
    if (key === "summarize") { router.push(`/document/${docId}/summary`); return; }
  }

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) return;

    const tempId = "temp-" + Date.now();
    const clean = file.name.replace(/\.pdf$/i, "");
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    dispatch({
      type: "ADD_UPLOAD",
      payload: {
        id: tempId,
        short: clean.slice(0, 26),
        title: clean,
        author: "Uploading…",
        color,
        status: "uploading",
        progress: 10,
        inContext: true,
        pages: undefined,
      },
    });

    try {
      const result = await api.uploadDocument(file);

      const realDoc: MindNestDocument = {
        id: result.id,
        short: clean.slice(0, 26),
        title: clean,
        author: "Uploaded just now",
        color,
        status: "ready",
        inContext: true,
        pages: undefined,
      };

      dispatch({ type: "REPLACE_UPLOAD", payload: { tempId, doc: realDoc } });
      router.push(`/document/${result.id}/chat`);
    } catch {
      // Remove the temp doc on failure
      dispatch({ type: "REPLACE_UPLOAD", payload: { tempId, doc: { id: tempId, short: "Upload failed", title: clean, author: "Error", color, status: "ready", inContext: false, pages: undefined } } });
    }
  }

  const user = getCurrentUser();
  const displayName = user?.name ?? "Student";
  const userInitials = displayName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      style={{
        width: 268, flexShrink: 0, background: "var(--mn-surface)",
        border: "1px solid var(--mn-border)", borderRadius: 18,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "18px 18px 14px" }}>
        <Logo />
      </div>

      {/* New chat */}
      <div style={{ padding: "4px 14px 12px" }}>
        <button
          onClick={() => { dispatch({ type: "NEW_CHAT" }); router.push(`/document/${docId}/chat`); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: 12, border: "none", borderRadius: 13,
            background: "var(--mn-accent-grad)", color: "#fff", fontFamily: "inherit",
            fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px var(--mn-accent-ring)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 4v10" /><path d="M4 9h10" />
          </svg>
          New chat
        </button>
      </div>

      {/* Study tools + docs */}
      <div style={{ flex: 1, overflow: "auto", padding: "2px 14px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--mn-text-3)", padding: "10px 6px 8px" }}>
          Study tools
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTool(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%",
                padding: "7px 8px", border: "none", background: "transparent",
                borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 600, color: "#cbd5e1", textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mn-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ flexShrink: 0, width: 31, height: 31, borderRadius: 9, background: t.color, color: t.iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Docs heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 6px 8px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Documents</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#56627a" }}>{state.docs.length}</span>
        </div>

        {/* Doc list */}
        {state.docs.map((d) => {
          const isActive = d.id === state.activeDocId;
          return (
            <div
              key={d.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 12,
                background: isActive ? "var(--mn-accent-soft)" : "transparent",
                border: `1.5px solid ${isActive ? "var(--mn-accent-mid)" : "transparent"}`,
                marginBottom: 6, cursor: "pointer", transition: ".15s",
              }}
              onClick={() => { dispatch({ type: "OPEN_DOC", payload: d.id }); router.push(`/document/${d.id}/chat`); }}
            >
              <div style={{ width: 27, height: 32, borderRadius: 6, background: d.color + "26", border: `1px solid ${d.color}55`, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
                <div style={{ width: 11, height: 2, borderRadius: 2, background: d.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>
                  {d.short}
                </div>
                {d.status === "uploading" ? (
                  <div style={{ height: 4, background: "#0e1626", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${d.progress ?? 0}%`, background: "var(--mn-accent-grad)", borderRadius: 3, transition: "width .2s" }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--mn-text-3)", marginTop: 1 }}>
                    {d.status === "ready" && !d.pages ? "Ready" : `${(d.pages?.length ?? 0)} pages`}
                  </div>
                )}
              </div>
              <div
                title="Include in chat context"
                onClick={(e) => { e.stopPropagation(); dispatch({ type: "TOGGLE_CONTEXT", payload: d.id }); }}
                style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: 7,
                  border: `1.5px solid ${d.inContext ? "var(--mn-accent)" : "#475569"}`,
                  background: d.inContext ? "var(--mn-accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                {d.inContext && (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,7.5 5.6,10 11,4" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}

        {/* Upload */}
        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            padding: "18px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", marginTop: 8,
            border: state.dragOver ? "1.5px dashed var(--mn-accent)" : "1.5px dashed rgba(148,163,184,.25)",
            background: state.dragOver ? "var(--mn-accent-soft)" : "transparent",
            transition: ".16s",
          }}
          onDragOver={(e) => { e.preventDefault(); dispatch({ type: "SET_DRAG_OVER", payload: true }); }}
          onDragLeave={(e) => { e.preventDefault(); dispatch({ type: "SET_DRAG_OVER", payload: false }); }}
          onDrop={(e) => {
            e.preventDefault();
            dispatch({ type: "SET_DRAG_OVER", payload: false });
            const f = e.dataTransfer.files[0];
            if (f) handleUpload(f);
          }}
        >
          <input
            ref={uploadInput}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <span style={{ width: 36, height: 36, borderRadius: 11, background: "var(--mn-accent-soft)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12V4.5" /><path d="M6 7l3-3 3 3" /><path d="M4 12.5v1.5h10v-1.5" />
            </svg>
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--mn-text-2)" }}>
            Drop a PDF or <span style={{ color: "#818cf8" }}>browse</span>
          </span>
        </label>
      </div>

      {/* User row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--mn-border)" }}>
        <div style={{ width: 33, height: 33, borderRadius: 11, background: "var(--mn-accent-grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "var(--mn-text-3)" }}>Free plan · {state.docs.length} docs</div>
        </div>
      </div>
    </aside>
  );
}
