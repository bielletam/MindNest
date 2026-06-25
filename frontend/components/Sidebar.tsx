"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { useDocContext } from "@/lib/document-context";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import type { ChatSession, MindNestDocument } from "@/lib/types";
import { getCurrentUser, logout } from "@/lib/auth";

const SESSIONS_VISIBLE_LIMIT = 7;

function dateGroupLabel(updatedAt: string): string {
  const d = new Date(updatedAt);
  const now = new Date();
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 6) return "Earlier this week";
  return "Earlier";
}

const SESSION_GROUP_ORDER = ["Today", "Yesterday", "Earlier this week", "Earlier"];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TOOLS = [
  {
    key: "summarize",
    route: "summary",
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
    route: "flashcards",
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
    route: "quiz",
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
    route: "mindmap",
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
  const { state, dispatch, openFlashcards } = useDocContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session");

  function activeTool(): string | null {
    for (const t of TOOLS) {
      if (pathname.endsWith(`/${t.route}`)) return t.key;
    }
    return null;
  }
  const activeToolKey = activeTool();
  const uploadInput = useRef<HTMLInputElement>(null);

  // ── Right-click context menu ──────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; docId: string } | null>(null);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => closeCtxMenu();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [ctxMenu, closeCtxMenu]);

  async function handleDeleteDoc(id: string) {
    closeCtxMenu();
    try {
      await api.deleteDocument(id);
      dispatch({ type: "REMOVE_DOC", payload: id });
      if (state.activeDocId === id) router.push("/");
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

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

  // ── Recent chats ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function refetchSessions(search?: string) {
    setLoadingSessions(true);
    api
      .fetchSessions(search || undefined)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }

  // Initial load, and refresh whenever the active session changes (covers a
  // brand-new session appearing, or message_count changing after a switch).
  useEffect(() => {
    refetchSessions(sessionSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => refetchSessions(sessionSearch), 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [sessionSearch]);

  function handleSelectSession(session: ChatSession) {
    const targetDocId = docId || session.document_ids[0] || "";
    router.push(`/document/${targetDocId}/chat?session=${session.id}`);
  }

  async function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId && docId) router.push(`/document/${docId}/chat`);
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  }

  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, SESSIONS_VISIBLE_LIMIT);
  const groupedSessions = new Map<string, ChatSession[]>();
  for (const s of visibleSessions) {
    const label = dateGroupLabel(s.updated_at);
    const list = groupedSessions.get(label) ?? [];
    list.push(s);
    groupedSessions.set(label, list);
  }

  const [displayName, setDisplayName] = useState("Student");
  const [userInitials, setUserInitials] = useState("ST");
  useEffect(() => {
    const u = getCurrentUser();
    if (u?.name) {
      const name = u.name;
      setDisplayName(name);
      setUserInitials(
        name.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
      );
    }
  }, []);

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
          onClick={() => router.push(`/document/${docId}/chat`)}
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

      {/* Recent chats + Study tools + Documents — one unified scroll region */}
      <div style={{ flex: 1, overflow: "auto", padding: "2px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 6px 8px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Recent chats</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#56627a" }}>{sessions.length}</span>
        </div>

        <div style={{ position: "relative", marginBottom: 8 }}>
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="var(--mn-text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="8" cy="8" r="5.5" /><line x1="12.2" y1="12.2" x2="16" y2="16" />
          </svg>
          <input
            type="text"
            placeholder="Search chats…"
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box", background: "var(--mn-surface-2)",
              border: "1px solid var(--mn-border-2)", borderRadius: 10,
              padding: "7px 10px 7px 30px", color: "#e2e8f0", fontFamily: "inherit",
              fontSize: 12.5, outline: "none",
            }}
          />
        </div>

        {loadingSessions && (
          <div style={{ textAlign: "center", padding: "14px 0", color: "var(--mn-text-3)", fontSize: 12 }}>
            Loading…
          </div>
        )}

        {!loadingSessions && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "14px 10px", color: "var(--mn-text-3)", fontSize: 12 }}>
            {sessionSearch ? "No chats match your search." : "No chats yet."}
          </div>
        )}

        {!loadingSessions && SESSION_GROUP_ORDER.filter((g) => groupedSessions.has(g)).map((groupLabel) => (
          <div key={groupLabel} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--mn-text-3)", padding: "6px 6px 4px" }}>
              {groupLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {groupedSessions.get(groupLabel)!.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  isActive={s.id === activeSessionId}
                  onSelect={() => handleSelectSession(s)}
                  onDelete={(e) => handleDeleteSession(s.id, e)}
                />
              ))}
            </div>
          </div>
        ))}

        {!loadingSessions && sessions.length > SESSIONS_VISIBLE_LIMIT && (
          <button
            onClick={() => setShowAllSessions((v) => !v)}
            style={{
              width: "100%", textAlign: "center", padding: "6px 6px 2px",
              border: "none", background: "transparent", color: "var(--mn-accent)",
              fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {showAllSessions ? "Show less" : `Show all (${sessions.length})`}
          </button>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--mn-text-3)", padding: "18px 6px 8px" }}>
          Study tools
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {TOOLS.map((t) => {
            const isActive = activeToolKey === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTool(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  padding: "7px 8px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: 600, textAlign: "left",
                  border: isActive ? `1px solid ${t.iconColor}33` : "1px solid transparent",
                  background: isActive ? `${t.color}` : "transparent",
                  color: isActive ? "#f1f5f9" : "#cbd5e1",
                  transition: ".15s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--mn-surface-2)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ flexShrink: 0, width: 31, height: 31, borderRadius: 9, background: t.color, color: t.iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
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
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu({ x: e.clientX, y: e.clientY, docId: d.id });
              }}
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

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 9999,
            background: "var(--mn-surface)",
            border: "1px solid var(--mn-border-2)",
            borderRadius: 10,
            padding: "4px",
            boxShadow: "0 8px 32px rgba(0,0,0,.45)",
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDeleteDoc(ctxMenu.docId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              padding: "8px 12px",
              border: "none",
              background: "transparent",
              borderRadius: 7,
              color: "#f87171",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,5 15,5" />
              <path d="M6 5V3.5h6V5" />
              <path d="M4.5 5l.9 10.1a1 1 0 0 0 1 .9h5.2a1 1 0 0 0 1-.9L13.5 5" />
              <line x1="7.5" y1="8.5" x2="7.5" y2="12.5" />
              <line x1="10.5" y1="8.5" x2="10.5" y2="12.5" />
            </svg>
            Remove document
          </button>
        </div>
      )}

      {/* User row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--mn-border)" }}>
        <div style={{ width: 33, height: 33, borderRadius: 11, background: "var(--mn-accent-grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>{displayName}</div>
        </div>
        <button
          title="Sign out"
          onClick={async () => { await logout(); router.push("/login"); }}
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: 9,
            border: "none", background: "transparent", cursor: "pointer",
            color: "var(--mn-text-3)", display: "flex", alignItems: "center", justifyContent: "center",
            transition: ".15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.12)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
            <polyline points="12 6 15 9 12 12" />
            <line x1="15" y1="9" x2="6" y2="9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

// ── Recent chat row ────────────────────────────────────────────────────────────

function SessionRow({
  session, isActive, onSelect, onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 8px", borderRadius: 10, cursor: "pointer",
        background: isActive ? "var(--mn-accent-soft)" : hovered ? "var(--mn-surface-2)" : "transparent",
        border: `1.5px solid ${isActive ? "var(--mn-accent-mid)" : "transparent"}`,
        transition: ".12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>
          {session.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--mn-text-3)", marginTop: 2 }}>
          {relativeTime(session.updated_at)} · {session.message_count} message{session.message_count !== 1 ? "s" : ""}
        </div>
      </div>
      {hovered && (
        <button
          onClick={onDelete}
          title="Delete chat"
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 7,
            border: "none", background: "transparent", color: "var(--mn-text-3)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.12)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,5 15,5" />
            <path d="M6 5V3.5h6V5" />
            <path d="M4.5 5l.9 10.1a1 1 0 0 0 1 .9h5.2a1 1 0 0 0 1-.9L13.5 5" />
            <line x1="7.5" y1="8.5" x2="7.5" y2="12.5" />
            <line x1="10.5" y1="8.5" x2="10.5" y2="12.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
