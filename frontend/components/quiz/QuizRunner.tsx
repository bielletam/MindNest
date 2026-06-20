"use client";

import { useState } from "react";
import type { QuizWithQuestions } from "@/lib/types";

interface Props {
  quiz: QuizWithQuestions;
  onFinish: (score: number, total: number) => void;
}

export function QuizRunner({ quiz, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const total = quiz.questions.length;
  const q = quiz.questions[idx];
  const isAnswered = answers[idx] !== undefined;
  const selectedOpt = answers[idx];
  const isLast = idx === total - 1;

  function handleSelect(optIdx: number) {
    if (isAnswered) return;
    setAnswers((prev) => ({ ...prev, [idx]: optIdx }));
  }

  function handleNext() {
    if (isLast) {
      const score = quiz.questions.reduce(
        (acc, question, i) => acc + (answers[i] === question.correct_index ? 1 : 0),
        0,
      );
      onFinish(score, total);
    } else {
      setIdx((i) => i + 1);
    }
  }

  function handleBack() {
    const prevIdx = idx - 1;
    // Clear the previous answer so the user can re-answer it.
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[prevIdx];
      return next;
    });
    setIdx(prevIdx);
  }

  const LABELS = ["A", "B", "C", "D"];

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 16, padding: "20px 22px 22px" }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {idx > 0 && (
              <button
                onClick={handleBack}
                title="Go back to previous question"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 8,
                  border: "1px solid var(--mn-border-2)",
                  background: "transparent", color: "var(--mn-text-3)",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: ".15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 4L6 8l4 4" />
                </svg>
                Back
              </button>
            )}
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mn-text-3)" }}>
              Question {idx + 1} of {total}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--mn-text-3)" }}>
            {quiz.title}
          </span>
        </div>
        <div style={{ height: 4, background: "var(--mn-surface-2)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((idx + 1) / total) * 100}%`,
              background: "var(--mn-accent-grad)",
              borderRadius: 4,
              transition: "width .3s ease",
            }}
          />
        </div>
      </div>

      {/* Question + options */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            padding: "24px 28px",
            borderRadius: 16,
            background: "var(--mn-surface-2)",
            border: "1px solid var(--mn-border-2)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.45,
            color: "#f1f5f9",
          }}
        >
          {q.question}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_index;
            const isSelected = selectedOpt === i;
            const isWrong = isSelected && !isCorrect;

            let bg = "var(--mn-surface-2)";
            let border = "var(--mn-border-2)";
            let color = "#cbd5e1";

            if (isAnswered) {
              if (isCorrect) { bg = "rgba(16,185,129,.16)"; border = "#10b981"; color = "#34d399"; }
              else if (isWrong) { bg = "rgba(239,68,68,.14)"; border = "#ef4444"; color = "#fca5a5"; }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "13px 18px", borderRadius: 13,
                  background: bg, border: `1.5px solid ${border}`, color,
                  fontFamily: "inherit", fontSize: 14, fontWeight: 500,
                  textAlign: "left", cursor: isAnswered ? "default" : "pointer",
                  transition: ".16s",
                }}
                onMouseEnter={(e) => { if (!isAnswered) e.currentTarget.style.background = "rgba(99,102,241,.12)"; }}
                onMouseLeave={(e) => { if (!isAnswered) e.currentTarget.style.background = "var(--mn-surface-2)"; }}
              >
                <span
                  style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12.5, fontWeight: 800,
                  }}
                >
                  {LABELS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && q.explanation && (
          <div
            style={{
              padding: "13px 18px", borderRadius: 12,
              background: "var(--mn-surface)",
              border: `1px solid ${selectedOpt === q.correct_index ? "rgba(16,185,129,.35)" : "rgba(239,68,68,.3)"}`,
              fontSize: 13.5, color: "var(--mn-text-2)", lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 700, color: selectedOpt === q.correct_index ? "#34d399" : "#fca5a5" }}>
              {selectedOpt === q.correct_index ? "Correct! " : "Incorrect. "}
            </span>
            {q.explanation}
          </div>
        )}

        {/* Next / finish button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            style={{
              alignSelf: "flex-start",
              padding: "11px 28px", borderRadius: 12,
              background: "var(--mn-accent-grad)", color: "#fff",
              border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 3px 12px var(--mn-accent-ring)",
            }}
          >
            {isLast ? "See results" : "Next question →"}
          </button>
        )}
      </div>
    </div>
  );
}
