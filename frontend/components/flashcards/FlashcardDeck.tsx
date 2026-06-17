"use client";

import { useState } from "react";
import { useDocContext } from "@/lib/document-context";
import { api } from "@/lib/api";
import type { BackendFlashcard } from "@/lib/types";

interface Props {
  docId: string;
  cards: BackendFlashcard[];
  loading: boolean;
  onCardsChange: (cards: BackendFlashcard[]) => void;
}

export function FlashcardDeck({ docId, cards, loading, onCardsChange }: Props) {
  const { activeDoc } = useDocContext();
  const color = activeDoc?.color ?? "#8b5cf6";

  // ── flip ────────────────────────────────────────────────────────────────────
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  function shuffle() {
    onCardsChange([...cards].sort(() => Math.random() - 0.5));
    setFlipped({});
  }

  // ── edit ────────────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  function startEdit(card: BackendFlashcard) {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditSaving(true);
    try {
      const updated = await api.updateFlashcard(editingId, { front: editFront, back: editBack });
      onCardsChange(cards.map((c) => (c.id === editingId ? updated : c)));
      setEditingId(null);
    } finally {
      setEditSaving(false);
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function doDelete(id: string) {
    await api.deleteFlashcard(id);
    onCardsChange(cards.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
  }

  // ── add manual ──────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addFront, setAddFront] = useState("");
  const [addBack, setAddBack] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  async function handleAdd() {
    if (!addFront.trim() || !addBack.trim()) return;
    setAddSaving(true);
    try {
      const card = await api.createFlashcard(docId, { front: addFront, back: addBack });
      onCardsChange([...cards, card]);
      setAddFront("");
      setAddBack("");
      setShowAdd(false);
    } finally {
      setAddSaving(false);
    }
  }

  // ── shared styles ────────────────────────────────────────────────────────────
  const textareaStyle: React.CSSProperties = {
    width: "100%", background: "var(--mn-surface)", border: "1px solid var(--mn-accent-mid)",
    borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontFamily: "inherit",
    fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box",
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <main
      style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 18, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ height: 56, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", gap: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--mn-text-3)" }}>
          {loading ? "Loading…" : `${cards.length} card${cards.length !== 1 ? "s" : ""} · tap to flip`}
        </div>
        <button
          onClick={shuffle}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", color: "#cbd5e1", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          Shuffle
        </button>
      </div>

      {/* Card grid */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, maxWidth: 800, margin: "0 auto", padding: "22px 22px 16px" }}>
          {cards.map((card) => {
            const isEditing = editingId === card.id;
            const isConfirmDelete = confirmDeleteId === card.id;
            const isFlipped = !!flipped[card.id];
            const cardColor = card.source === "manual" ? "#22d3ee" : color;

            if (isEditing) {
              return (
                <div key={card.id} style={{ background: "var(--mn-surface-2)", border: "1px solid var(--mn-accent-mid)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea rows={3} value={editFront} onChange={(e) => setEditFront(e.target.value)} placeholder="Front" style={textareaStyle} />
                  <textarea rows={3} value={editBack} onChange={(e) => setEditBack(e.target.value)} placeholder="Back" style={textareaStyle} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveEdit} disabled={editSaving} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: "var(--mn-accent-grad)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            if (isConfirmDelete) {
              return (
                <div key={card.id} style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, justifyContent: "center", minHeight: 130 }}>
                  <div style={{ fontSize: 13, color: "#fca5a5", textAlign: "center" }}>Delete this card?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => doDelete(card.id)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={card.id} style={{ perspective: 1100, height: 178, userSelect: "none" }}>
                <div style={{ position: "relative", width: "100%", height: "100%", transition: "transform .55s cubic-bezier(.4,.2,.2,1)", transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                  {/* Front */}
                  <div
                    onClick={() => setFlipped((f) => ({ ...f, [card.id]: !f[card.id] }))}
                    style={{ position: "absolute", inset: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cardColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Question</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 2 }}>
                        <button title="Edit" onClick={() => startEdit(card)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--mn-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "var(--mn-surface)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mn-text-3)"; e.currentTarget.style.background = "transparent"; }}>
                          <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2l3 3-9 9H4v-3L13 2z" /></svg>
                        </button>
                        <button title="Delete" onClick={() => setConfirmDeleteId(card.id)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--mn-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mn-text-3)"; e.currentTarget.style.background = "transparent"; }}>
                          <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,5 15,5" /><path d="M6 5V3h6v2" /><path d="M4 5l1 10h8l1-10" /></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, color: "#e8edf5" }}>{card.front}</div>
                    <div style={{ fontSize: 10.5, color: "var(--mn-text-3)" }}>Tap to flip ↩</div>
                  </div>
                  {/* Back */}
                  <div
                    onClick={() => setFlipped((f) => ({ ...f, [card.id]: !f[card.id] }))}
                    style={{ position: "absolute", inset: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(150deg,rgba(99,102,241,.2),rgba(139,92,246,.12))", border: "1px solid var(--mn-accent-mid)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#a5b4fc" }}>Answer</div>
                    <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.46, color: "#eef1f8" }}>{card.back}</div>
                    <div style={{ fontSize: 10.5, color: "var(--mn-text-2)" }}>
                      {card.source === "manual" ? "Manual" : card.source_pages ? `p.${card.source_pages.join(", ")}` : "AI"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add card */}
          {showAdd ? (
            <div style={{ background: "var(--mn-surface-2)", border: "1px solid var(--mn-accent-mid)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea rows={3} value={addFront} onChange={(e) => setAddFront(e.target.value)} placeholder="Front (question / term)" style={textareaStyle} />
              <textarea rows={3} value={addBack} onChange={(e) => setAddBack(e.target.value)} placeholder="Back (answer / definition)" style={textareaStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAdd} disabled={addSaving || !addFront.trim() || !addBack.trim()} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: "var(--mn-accent-grad)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {addSaving ? "Saving…" : "Add"}
                </button>
                <button onClick={() => { setShowAdd(false); setAddFront(""); setAddBack(""); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{ height: 178, borderRadius: 16, border: "1.5px dashed rgba(148,163,184,.25)", background: "transparent", color: "var(--mn-text-3)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: ".15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--mn-accent)"; e.currentTarget.style.color = "#818cf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,.25)"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 4v10" /><path d="M4 9h10" /></svg>
              Add flashcard
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {cards.length === 0 && !loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--mn-accent-soft)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="12" rx="2" /><rect x="6" y="3" width="16" height="12" rx="2" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>No flashcards yet</div>
          <div style={{ fontSize: 13, color: "var(--mn-text-3)", maxWidth: 280 }}>Use the generator above to create AI flashcards, or add one manually.</div>
        </div>
      )}
    </main>
  );
}
