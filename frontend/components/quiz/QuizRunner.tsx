"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { seedQuiz } from "@/lib/seed-data";

type QuizState =
  | { phase: "idle" }
  | { phase: "running"; questions: ReturnType<typeof seedQuiz>; idx: number; selected: number | null; answers: Record<number, number>; showExp: boolean }
  | { phase: "done"; score: number; total: number };

type QAction =
  | { type: "START" }
  | { type: "SELECT"; payload: number }
  | { type: "NEXT" }
  | { type: "RESTART" };

function quizReducer(state: QuizState, action: QAction): QuizState {
  if (action.type === "START") {
    return { phase: "running", questions: seedQuiz(), idx: 0, selected: null, answers: {}, showExp: false };
  }
  if (state.phase !== "running") return state;

  if (action.type === "SELECT" && state.selected === null) {
    return { ...state, selected: action.payload, showExp: true, answers: { ...state.answers, [state.idx]: action.payload } };
  }
  if (action.type === "NEXT") {
    if (state.idx + 1 >= state.questions.length) {
      const score = Object.entries(state.answers).filter(([i, a]) => state.questions[Number(i)].correct === a).length;
      return { phase: "done", score, total: state.questions.length };
    }
    return { ...state, idx: state.idx + 1, selected: null, showExp: false };
  }
  if (action.type === "RESTART") {
    return { phase: "idle" };
  }
  return state;
}

export function QuizRunner({ docId }: { docId: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, { phase: "idle" });

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
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>Quiz</div>
          <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>
            {state.phase === "running" ? `Question ${state.idx + 1} of ${state.questions.length}` : `${seedQuiz().length} questions`}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        {/* Idle */}
        {state.phase === "idle" && (
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Ready to test yourself?</div>
            <div style={{ fontSize: 14, color: "var(--mn-text-2)", lineHeight: 1.6, marginBottom: 28 }}>
              {seedQuiz().length} questions drawn from Memory Systems, Sleep & Learning, and Attention & Perception.
            </div>
            <button
              onClick={() => dispatch({ type: "START" })}
              style={{ padding: "14px 36px", borderRadius: 14, background: "var(--mn-accent-grad)", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px var(--mn-accent-ring)" }}
            >
              Start quiz
            </button>
          </div>
        )}

        {/* Running */}
        {state.phase === "running" && (() => {
          const q = state.questions[state.idx];
          return (
            <div style={{ width: "100%", maxWidth: 580 }}>
              {/* Progress */}
              <div style={{ height: 4, background: "var(--mn-surface-2)", borderRadius: 4, marginBottom: 28, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((state.idx + 1) / state.questions.length) * 100}%`, background: "var(--mn-accent-grad)", borderRadius: 4, transition: "width .3s" }} />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mn-text-3)", marginBottom: 14 }}>
                Question {state.idx + 1}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: "#f1f5f9", marginBottom: 28 }}>{q.question}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => {
                  const chosen = state.selected === i;
                  const correct = i === q.correct;
                  const wrong = chosen && !correct;
                  let bg = "var(--mn-surface-2)";
                  let border = "var(--mn-border-2)";
                  let color = "#cbd5e1";
                  if (state.selected !== null) {
                    if (correct) { bg = "rgba(16,185,129,.16)"; border = "#10b981"; color = "#34d399"; }
                    else if (wrong) { bg = "rgba(239,68,68,.14)"; border = "#ef4444"; color = "#fca5a5"; }
                  } else if (chosen) {
                    bg = "var(--mn-accent-soft)"; border = "var(--mn-accent)";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => dispatch({ type: "SELECT", payload: i })}
                      disabled={state.selected !== null}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 13, background: bg, border: `1.5px solid ${border}`, color, fontFamily: "inherit", fontSize: 15, fontWeight: 500, textAlign: "left", cursor: state.selected !== null ? "default" : "pointer", transition: ".16s" }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {state.showExp && (
                <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: "var(--mn-surface-3)", border: "1px solid var(--mn-border-2)", fontSize: 14, color: "var(--mn-text-2)", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: state.selected === q.correct ? "#34d399" : "#fca5a5" }}>
                    {state.selected === q.correct ? "Correct! " : "Incorrect. "}
                  </span>
                  {q.explanation}
                </div>
              )}

              {state.selected !== null && (
                <button
                  onClick={() => dispatch({ type: "NEXT" })}
                  style={{ marginTop: 24, padding: "12px 32px", borderRadius: 12, background: "var(--mn-accent-grad)", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px var(--mn-accent-ring)" }}
                >
                  {state.idx + 1 >= state.questions.length ? "See results" : "Next question →"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Done */}
        {state.phase === "done" && (
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {state.score === state.total ? "🏆" : state.score >= state.total / 2 ? "👍" : "📖"}
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>
              {state.score}/{state.total}
            </div>
            <div style={{ fontSize: 16, color: "var(--mn-text-2)", marginBottom: 28 }}>
              {state.score === state.total
                ? "Perfect score! Outstanding work."
                : state.score >= state.total / 2
                ? "Good job! Review the ones you missed."
                : "Keep studying — you'll get there."}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => dispatch({ type: "RESTART" })}
                style={{ padding: "12px 28px", borderRadius: 12, background: "var(--mn-accent-grad)", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px var(--mn-accent-ring)" }}
              >
                Retry quiz
              </button>
              <button
                onClick={() => router.push(`/document/${docId}/chat`)}
                style={{ padding: "12px 28px", borderRadius: 12, background: "var(--mn-surface-2)", color: "#cbd5e1", border: "1px solid var(--mn-border-2)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Back to chat
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
