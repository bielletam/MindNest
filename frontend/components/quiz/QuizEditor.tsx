"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { QuizQuestion, QuizWithQuestions } from "@/lib/types";

interface Props {
  quiz: QuizWithQuestions;
  onUpdate: (updated: QuizWithQuestions) => void;
}

interface EditState {
  question: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
}

function emptyEdit(q: QuizQuestion): EditState {
  return {
    question: q.question,
    options: [q.options[0] ?? "", q.options[1] ?? "", q.options[2] ?? "", q.options[3] ?? ""],
    correct_index: q.correct_index,
    explanation: q.explanation ?? "",
  };
}

const LABELS = ["A", "B", "C", "D"];

export function QuizEditor({ quiz, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addState, setAddState] = useState<EditState>({
    question: "", options: ["", "", "", ""], correct_index: 0, explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(q: QuizQuestion) {
    setEditingId(q.id);
    setEditState(emptyEdit(q));
    setDeletingId(null);
    setAdding(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit(qId: string) {
    if (!editState) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateQuestion(qId, {
        question: editState.question.trim(),
        options: editState.options.map((o) => o.trim()),
        correct_index: editState.correct_index,
        explanation: editState.explanation.trim() || undefined,
      });
      const newQuestions = quiz.questions.map((q) => (q.id === qId ? updated : q));
      onUpdate({ ...quiz, questions: newQuestions });
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(qId: string) {
    setSaving(true);
    setError("");
    try {
      await api.deleteQuestion(qId);
      const newQuestions = quiz.questions.filter((q) => q.id !== qId);
      onUpdate({ ...quiz, questions: newQuestions, question_count: newQuestions.length });
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAdd() {
    setSaving(true);
    setError("");
    try {
      const created = await api.createQuestion(quiz.id, {
        question: addState.question.trim(),
        options: addState.options.map((o) => o.trim()),
        correct_index: addState.correct_index,
        explanation: addState.explanation.trim() || undefined,
      });
      const newQuestions = [...quiz.questions, created];
      onUpdate({ ...quiz, questions: newQuestions, question_count: newQuestions.length });
      setAdding(false);
      setAddState({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)",
    borderRadius: 8, padding: "7px 10px", color: "#e2e8f0",
    fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%",
    boxSizing: "border-box",
  };

  function InlineForm({ state, setState, onSave, onCancel, submitLabel }: {
    state: EditState;
    setState: (s: EditState) => void;
    onSave: () => void;
    onCancel: () => void;
    submitLabel: string;
  }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", background: "var(--mn-surface)", border: "1px solid var(--mn-border-2)", borderRadius: 12, marginTop: 8 }}>
        <textarea
          rows={2}
          placeholder="Question text"
          value={state.question}
          onChange={(e) => setState({ ...state, question: e.target.value })}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {state.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 20, flexShrink: 0, fontSize: 12, fontWeight: 700, color: i === state.correct_index ? "#34d399" : "var(--mn-text-3)", textAlign: "center" }}>
                {LABELS[i]}
              </span>
              <input
                type="text"
                placeholder={`Option ${LABELS[i]}`}
                value={opt}
                onChange={(e) => {
                  const opts = [...state.options] as [string, string, string, string];
                  opts[i] = e.target.value;
                  setState({ ...state, options: opts });
                }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setState({ ...state, correct_index: i })}
                title="Mark as correct"
                style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: 8,
                  border: `1.5px solid ${i === state.correct_index ? "rgba(16,185,129,.6)" : "var(--mn-border-2)"}`,
                  background: i === state.correct_index ? "rgba(16,185,129,.15)" : "transparent",
                  color: i === state.correct_index ? "#34d399" : "var(--mn-text-3)",
                  fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                }}
              >
                {i === state.correct_index ? "✓ Correct" : "Set correct"}
              </button>
            </div>
          ))}
        </div>

        <textarea
          rows={2}
          placeholder="Explanation (optional)"
          value={state.explanation}
          onChange={(e) => setState({ ...state, explanation: e.target.value })}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSave}
            disabled={saving || !state.question.trim()}
            style={{
              padding: "7px 18px", borderRadius: 9, border: "none",
              background: saving || !state.question.trim() ? "#1e293b" : "var(--mn-accent-grad)",
              color: saving || !state.question.trim() ? "var(--mn-text-3)" : "#fff",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              cursor: saving || !state.question.trim() ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : submitLabel}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 16px", borderRadius: 9, border: "1px solid var(--mn-border-2)",
              background: "transparent", color: "var(--mn-text-3)",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Quiz title */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{quiz.title ?? "Quiz"}</div>
        {quiz.scope_description && (
          <div style={{ fontSize: 12, color: "var(--mn-text-3)", marginTop: 2 }}>{quiz.scope_description}</div>
        )}
        <div style={{ fontSize: 12, color: "var(--mn-text-3)", marginTop: 1 }}>
          {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 14px", color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Question list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quiz.questions.map((q, qi) => (
          <div
            key={q.id}
            style={{
              background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)",
              borderRadius: 14, padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--mn-text-3)", marginTop: 3, minWidth: 20 }}>
                {qi + 1}.
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>{q.question}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: oi === q.correct_index ? "#34d399" : "var(--mn-text-3)", width: 14, flexShrink: 0 }}>
                        {LABELS[oi]}
                      </span>
                      <span style={{ fontSize: 13, color: oi === q.correct_index ? "#86efac" : "var(--mn-text-2)" }}>
                        {opt}
                        {oi === q.correct_index && (
                          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: "#34d399" }}>✓</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {q.source === "manual" && (
                  <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--mn-text-3)", background: "var(--mn-surface)", borderRadius: 5, padding: "2px 7px", border: "1px solid var(--mn-border-2)" }}>
                    manual
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {deletingId === q.id ? (
                  <>
                    <button
                      onClick={() => confirmDelete(q.id)}
                      disabled={saving}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "rgba(239,68,68,.15)", color: "#f87171", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      {saving ? "…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-3)", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(q)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-3)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface)"; e.currentTarget.style.color = "#e2e8f0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setDeletingId(q.id); setEditingId(null); setAdding(false); }}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "transparent", color: "#f87171", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === q.id && editState && (
              <InlineForm
                state={editState}
                setState={setEditState}
                onSave={() => saveEdit(q.id)}
                onCancel={cancelEdit}
                submitLabel="Save changes"
              />
            )}
          </div>
        ))}
      </div>

      {/* Add question */}
      {adding ? (
        <InlineForm
          state={addState}
          setState={setAddState}
          onSave={saveAdd}
          onCancel={() => { setAdding(false); setAddState({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" }); }}
          submitLabel="Add question"
        />
      ) : (
        <button
          onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null); }}
          style={{
            alignSelf: "flex-start",
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 12,
            border: "1.5px dashed rgba(148,163,184,.3)",
            background: "transparent", color: "var(--mn-text-3)",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: ".15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--mn-accent-mid)"; e.currentTarget.style.color = "#a5b4fc"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,.3)"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
          Add question
        </button>
      )}
    </div>
  );
}
