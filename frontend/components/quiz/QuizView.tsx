"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Quiz, QuizWithQuestions } from "@/lib/types";
import { GenerationScopePicker } from "./GenerationScopePicker";
import { QuizRunner } from "./QuizRunner";
import { QuizResultScreen } from "./QuizResultScreen";
import { QuizEditor } from "./QuizEditor";

type ViewMode = "generate" | "take" | "edit";

interface Props {
  docId: string;
}

export function QuizView({ docId }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizWithQuestions | null>(null);
  const [mode, setMode] = useState<ViewMode>("generate");
  const [runnerKey, setRunnerKey] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [fetchingQuiz, setFetchingQuiz] = useState(false);
  const [listError, setListError] = useState("");

  useEffect(() => {
    api.fetchQuizzes(docId)
      .then(setQuizzes)
      .catch(() => setListError("Failed to load quizzes."))
      .finally(() => setLoadingList(false));
  }, [docId]);

  function handleGenerated(quiz: QuizWithQuestions) {
    setQuizzes((prev) => [
      { id: quiz.id, document_id: quiz.document_id, title: quiz.title, scope_description: quiz.scope_description, created_at: quiz.created_at, question_count: quiz.questions.length },
      ...prev,
    ]);
  }

  async function openQuiz(quizId: string, target: "take" | "edit") {
    setFetchingQuiz(true);
    try {
      const full = await api.fetchQuiz(quizId);
      setActiveQuiz(full);
      setResult(null);
      setRunnerKey((k) => k + 1);
      setMode(target);
    } catch {
      setListError("Failed to load quiz.");
    } finally {
      setFetchingQuiz(false);
    }
  }

  async function handleDeleteQuiz(quizId: string) {
    try {
      await api.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (activeQuiz?.id === quizId) {
        setActiveQuiz(null);
        setMode("generate");
      }
    } catch {
      setListError("Failed to delete quiz.");
    }
  }

  function handleFinish(score: number, total: number) {
    setResult({ score, total });
  }

  function handleRetake() {
    setResult(null);
    setRunnerKey((k) => k + 1);
  }

  const tabBtn = (label: string, target: ViewMode, disabled = false): React.ReactNode => {
    const active = mode === target;
    return (
      <button
        onClick={() => { if (!disabled) setMode(target); }}
        disabled={disabled}
        style={{
          padding: "7px 18px", borderRadius: 999, border: "none",
          fontFamily: "inherit", fontSize: 13, fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer", transition: ".15s",
          background: active ? "var(--mn-accent-grad)" : "var(--mn-surface-2)",
          color: active ? "#fff" : disabled ? "#475569" : "var(--mn-text-2)",
          boxShadow: active ? "0 2px 10px var(--mn-accent-ring)" : "none",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14, padding: 18, overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0, background: "var(--mn-surface)", border: "1px solid var(--mn-border)", borderRadius: 18, padding: "12px 16px" }}>
        {tabBtn("Generate", "generate")}
        {tabBtn("Take quiz", "take", activeQuiz === null)}
        {tabBtn("Edit quiz", "edit", activeQuiz === null)}
      </div>

      {/* Generate tab */}
      {mode === "generate" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
          <GenerationScopePicker docId={docId} onGenerated={handleGenerated} />

          {/* Quiz list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loadingList && (
              <div style={{ textAlign: "center", padding: 20, color: "var(--mn-text-3)", fontSize: 13 }}>
                Loading quizzes…
              </div>
            )}
            {listError && (
              <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "9px 14px", color: "#fca5a5", fontSize: 13 }}>
                {listError}
              </div>
            )}
            {!loadingList && quizzes.length === 0 && !listError && (
              <div style={{ textAlign: "center", padding: 32, color: "var(--mn-text-3)", fontSize: 13 }}>
                No quizzes yet. Generate one above.
              </div>
            )}
            {quizzes.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                onTake={() => openQuiz(q.id, "take")}
                onEdit={() => openQuiz(q.id, "edit")}
                onDelete={() => handleDeleteQuiz(q.id)}
                loading={fetchingQuiz}
              />
            ))}
          </div>
        </div>
      )}

      {/* Take quiz tab */}
      {mode === "take" && activeQuiz && (
        <div style={{ flex: 1, minHeight: 0, background: "var(--mn-surface)", border: "1px solid var(--mn-border)", borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 52, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="6"/><polyline points="6.3,9.2 8.1,11 11.4,7.2"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mn-text-3)" }}>Quiz</span>
            {activeQuiz.title && (
              <span style={{ fontSize: 12, color: "#56627a" }}>· {activeQuiz.title}</span>
            )}
          </div>
          {result ? (
            <QuizResultScreen
              score={result.score}
              total={result.total}
              onRetake={handleRetake}
              onBrowse={() => setMode("generate")}
            />
          ) : (
            <QuizRunner key={runnerKey} quiz={activeQuiz} onFinish={handleFinish} />
          )}
        </div>
      )}

      {/* Edit tab */}
      {mode === "edit" && activeQuiz && (
        <div style={{ flex: 1, minHeight: 0, background: "var(--mn-surface)", border: "1px solid var(--mn-border)", borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 52, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12.5V15h2.5l7.4-7.4-2.5-2.5L3 12.5z"/><path d="M12.8 4.2l1-1a1 1 0 0 1 1.4 1.4l-1 1-2.4-2.4z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mn-text-3)" }}>Edit quiz</span>
          </div>
          <QuizEditor
            quiz={activeQuiz}
            onUpdate={(updated) => {
              setActiveQuiz(updated);
              setQuizzes((prev) =>
                prev.map((q) =>
                  q.id === updated.id
                    ? { ...q, question_count: updated.questions.length }
                    : q
                )
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Quiz list card ────────────────────────────────────────────────────────────

function QuizCard({
  quiz, onTake, onEdit, onDelete, loading,
}: {
  quiz: Quiz;
  onTake: () => void;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const date = new Date(quiz.created_at).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      style={{
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14,
      }}
    >
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {quiz.title ?? "Quiz"}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
          {quiz.scope_description && (
            <span style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{quiz.scope_description}</span>
          )}
          <span style={{ fontSize: 11.5, color: "#56627a" }}>
            {quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 11.5, color: "#56627a" }}>{date}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
        {confirmDelete ? (
          <>
            <button
              onClick={onDelete}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(239,68,68,.15)", color: "#f87171", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "var(--mn-text-3)", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onTake}
              disabled={loading}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--mn-accent-grad)", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer", boxShadow: "0 2px 8px var(--mn-accent-ring)" }}
            >
              Take quiz
            </button>
            <button
              onClick={onEdit}
              disabled={loading}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--mn-border-2)", background: "transparent", color: "#cbd5e1", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "transparent", color: "#f87171", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
