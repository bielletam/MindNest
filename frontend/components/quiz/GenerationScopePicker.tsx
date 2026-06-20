"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { QuizWithQuestions } from "@/lib/types";

type Mode = "whole" | "range";

interface Props {
  docId: string;
  onGenerated: (quiz: QuizWithQuestions) => void;
}

export function GenerationScopePicker({ docId, onGenerated }: Props) {
  const [mode, setMode] = useState<Mode>("whole");
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");
  const [count, setCount] = useState("10");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const req: Parameters<typeof api.generateQuiz>[1] = {
        count: Math.min(30, Math.max(3, parseInt(count, 10) || 10)),
      };
      if (title.trim()) req.title = title.trim();
      if (mode === "range") {
        req.page_start = parseInt(pageStart, 10);
        req.page_end = parseInt(pageEnd, 10);
      }
      const quiz = await api.generateQuiz(docId, req);
      onGenerated(quiz);
      setTitle("");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Generation failed.";
      const match = raw.match(/API \d+: (.+)/);
      if (match) {
        try {
          const detail = JSON.parse(match[1]) as { detail?: string };
          setError(detail.detail ?? match[1]);
        } catch {
          setError(match[1]);
        }
      } else {
        setError(raw);
      }
    } finally {
      setGenerating(false);
    }
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 16px", borderRadius: 999, border: "none", fontFamily: "inherit",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: ".15s",
    background: active ? "var(--mn-accent-grad)" : "var(--mn-surface-2)",
    color: active ? "#fff" : "var(--mn-text-2)",
    boxShadow: active ? "0 2px 8px var(--mn-accent-ring)" : "none",
  });

  const inputStyle: React.CSSProperties = {
    background: "var(--mn-surface)", border: "1px solid var(--mn-border-2)",
    borderRadius: 9, padding: "7px 12px", color: "#e2e8f0",
    fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%",
    boxSizing: "border-box",
  };

  const canGenerate =
    !generating &&
    (mode === "whole" || (mode === "range" && pageStart && pageEnd));

  return (
    <div
      style={{
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 18, padding: "16px 20px", flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mn-text-3)", marginBottom: 12 }}>
        Generate quiz
      </div>

      {/* Optional title */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Quiz title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button style={btnStyle(mode === "whole")} onClick={() => setMode("whole")}>Whole document</button>
        <button style={btnStyle(mode === "range")} onClick={() => setMode("range")}>Page range</button>
      </div>

      {/* Scope inputs */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {mode === "range" && (
          <>
            <input
              type="number" min={1} placeholder="From page" value={pageStart}
              onChange={(e) => setPageStart(e.target.value)}
              style={{ ...inputStyle, width: 110 }}
            />
            <span style={{ color: "var(--mn-text-3)", fontSize: 13 }}>–</span>
            <input
              type="number" min={1} placeholder="To page" value={pageEnd}
              onChange={(e) => setPageEnd(e.target.value)}
              style={{ ...inputStyle, width: 110 }}
            />
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 12.5, color: "var(--mn-text-3)", whiteSpace: "nowrap" }}>Questions:</span>
          <input
            type="number" min={3} max={30} value={count}
            onChange={(e) => setCount(e.target.value)}
            style={{ ...inputStyle, width: 60 }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            padding: "8px 20px", borderRadius: 10, border: "none",
            fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            cursor: canGenerate ? "pointer" : "not-allowed",
            background: canGenerate ? "var(--mn-accent-grad)" : "#1e293b",
            color: canGenerate ? "#fff" : "var(--mn-text-3)",
            boxShadow: canGenerate ? "0 3px 10px var(--mn-accent-ring)" : "none",
            transition: ".15s",
          }}
        >
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "9px 14px", color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}
