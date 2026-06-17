"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDocContext } from "@/lib/document-context";
import { LogoMarkLarge, LogoMarkWhite } from "@/components/ui/Logo";

const QUICK_PROMPTS = [
  "What is the main topic of this document?",
  "Summarize the key concepts",
  "What are the most important points?",
];

export function ChatWindow({ docId }: { docId: string }) {
  const { state, activeDoc, send, openCite, openFlashcards, dispatch } = useDocContext();
  const chatRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [state.messages]);

  const contextDocs = state.docs.filter((d) => d.inContext);

  return (
    <main
      style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 18, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.01em", color: "#f8fafc", flexShrink: 0 }}>Chat</div>
          <div style={{ width: 1, height: 18, background: "var(--mn-border-2)", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontSize: 11.5, color: "var(--mn-text-3)", fontWeight: 600, flexShrink: 0 }}>Context</span>
            {contextDocs.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden" }}>
                {contextDocs.map((d) => (
                  <span
                    key={d.id}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap" }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
                    {d.short}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 11.5, color: "var(--mn-text-3)", fontStyle: "italic" }}>No documents selected</span>
            )}
          </div>
        </div>

        {!state.showViewer && (
          <button
            onClick={() => dispatch({ type: "SHOW_VIEWER", payload: true })}
            style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: "8px 14px", border: "1px solid var(--mn-border-2)", borderRadius: 999, background: "var(--mn-surface-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "#cbd5e1", cursor: "pointer" }}
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="10" height="12" rx="2" />
              <line x1="6.5" y1="7" x2="11.5" y2="7" />
              <line x1="6.5" y1="10" x2="11.5" y2="10" />
            </svg>
            Show PDF
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "26px 0" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 26px", display: "flex", flexDirection: "column", gap: 22, minHeight: "100%" }}>
          {state.messages.length === 0 && (
            <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "30px 0" }}>
              <LogoMarkLarge />
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginTop: 8, color: "#f8fafc" }}>
                Ask anything about your library
              </div>
              <div style={{ fontSize: 14, color: "var(--mn-text-2)", maxWidth: 430, lineHeight: 1.55 }}>
                MindNest reads across your documents and answers with citations you can trace back to the source.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", marginTop: 16, maxWidth: 560 }}>
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{ padding: "10px 15px", border: "1.5px solid var(--mn-border-2)", borderRadius: 999, background: "var(--mn-surface-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#cbd5e1", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--mn-accent)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--mn-border-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.messages.map((m) => (
            <div key={m.id} className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {m.role === "user" ? (
                <div
                  style={{
                    alignSelf: "flex-end", maxWidth: "80%",
                    background: "var(--mn-accent-grad)", color: "#fff",
                    padding: "12px 17px", borderRadius: "18px 18px 6px 18px",
                    fontSize: 15, lineHeight: 1.5, fontWeight: 500,
                    boxShadow: "0 4px 14px var(--mn-accent-ring)",
                  }}
                >
                  {m.text}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: 11,
                      background: "var(--mn-accent-grad)", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 3px 10px var(--mn-accent-ring)", marginTop: 2,
                    }}
                  >
                    <LogoMarkWhite />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--mn-text-2)", margin: "6px 0 7px" }}>Nest</div>
                    {m.streaming && !m.text ? (
                      <div style={{ display: "inline-flex", gap: 5, padding: "14px 16px", background: "var(--mn-surface-2)", border: "1px solid var(--mn-border)", borderRadius: "6px 16px 16px 16px" }}>
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <span key={i} className="animate-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#5b6678", animationDelay: `${delay}s` }} />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{ background: "var(--mn-surface-2)", border: "1px solid var(--mn-border)", borderRadius: "6px 16px 16px 16px", padding: "15px 19px", fontSize: 15, lineHeight: 1.64, color: "#dbe3ee", whiteSpace: "pre-wrap" }}
                      >
                        {m.text}
                      </div>
                    )}
                    {!m.streaming && (m.cites ?? []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
                        {(m.cites ?? []).map((c, i) => {
                          const doc = state.docs.find((d) => d.id === c.doc);
                          return (
                            <button
                              key={i}
                              onClick={() => openCite(c)}
                              title={c.snippet}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 7,
                                background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)",
                                color: "#c7d2fe", padding: "6px 12px 6px 10px", borderRadius: 999,
                                fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--mn-accent)"; e.currentTarget.style.background = "var(--mn-surface-3)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--mn-border-2)"; e.currentTarget.style.background = "var(--mn-surface-2)"; }}
                            >
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: doc?.color ?? "#999", flexShrink: 0 }} />
                              <span>{doc?.short ?? "Source"}</span>
                              <span style={{ opacity: 0.6, fontWeight: 600, color: "var(--mn-text-2)" }}>p.{c.page}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--mn-border)", padding: "16px 26px 16px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "var(--mn-surface-2)", border: "1.5px solid var(--mn-border-2)", borderRadius: 16, padding: "7px 7px 7px 17px" }}>
            <textarea
              value={state.input}
              onChange={(e) => dispatch({ type: "SET_INPUT", payload: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Ask anything about your documents…"
              style={{ flex: 1, border: "none", outline: "none", resize: "none", fontFamily: "inherit", fontSize: 15, lineHeight: 1.5, color: "#f1f5f9", background: "transparent", maxHeight: 130, padding: "8px 0" }}
            />
            <button
              onClick={() => send()}
              style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: "var(--mn-accent-grad)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", boxShadow: "0 3px 12px var(--mn-accent-ring)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 9h11" /><path d="M10.5 5l4 4-4 4" />
              </svg>
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--mn-text-3)", marginTop: 10 }}>
            MindNest can make mistakes. Check answers against the source.
          </div>
        </div>
      </div>
    </main>
  );
}
