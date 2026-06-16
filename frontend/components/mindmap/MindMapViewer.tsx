"use client";

import { useRouter } from "next/navigation";
import { useDocContext } from "@/lib/document-context";

const MAP_DATA = {
  label: "Memory & Learning",
  color: "#818cf8",
  children: [
    {
      label: "Memory Systems",
      color: "#10b981",
      children: [
        { label: "Sensory Memory", color: "#10b981", children: [] },
        { label: "Working Memory\n~4 chunks · seconds", color: "#10b981", children: [] },
        { label: "Long-Term Memory\nunlimited · decades", color: "#10b981", children: [] },
      ],
    },
    {
      label: "Consolidation",
      color: "#3b82f6",
      children: [
        { label: "Slow-wave sleep\nhippocampal replay", color: "#3b82f6", children: [] },
        { label: "REM sleep\nemotional & procedural", color: "#3b82f6", children: [] },
        { label: "Active recall\nreconsolidation", color: "#3b82f6", children: [] },
      ],
    },
    {
      label: "Attention",
      color: "#f59e0b",
      children: [
        { label: "Selective attention\nfilters input", color: "#f59e0b", children: [] },
        { label: "Divided attention\ncognitive cost", color: "#f59e0b", children: [] },
      ],
    },
    {
      label: "Forgetting",
      color: "#8b5cf6",
      children: [
        { label: "Forgetting curve", color: "#8b5cf6", children: [] },
        { label: "Spaced repetition\nresets curve", color: "#8b5cf6", children: [] },
      ],
    },
  ],
};

interface Node {
  label: string;
  color: string;
  children: Node[];
}

function NodeBubble({ node, depth }: { node: Node; depth: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div
        style={{
          padding: depth === 0 ? "12px 22px" : depth === 1 ? "9px 16px" : "7px 13px",
          borderRadius: 12,
          background: depth === 0 ? "var(--mn-accent-grad)" : node.color + "26",
          border: `1.5px solid ${node.color}66`,
          color: depth === 0 ? "#fff" : node.color,
          fontSize: depth === 0 ? 15 : depth === 1 ? 13.5 : 12,
          fontWeight: depth === 0 ? 800 : 700,
          textAlign: "center",
          whiteSpace: "pre-line",
          lineHeight: 1.3,
          boxShadow: depth === 0 ? "0 6px 20px var(--mn-accent-ring)" : "none",
          minWidth: depth === 2 ? 120 : undefined,
        }}
      >
        {node.label}
      </div>
      {node.children.length > 0 && (
        <>
          <div style={{ width: 1.5, height: 18, background: node.color + "55" }} />
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
            {/* Horizontal line spanning children */}
            {node.children.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "calc(50% / " + node.children.length + ")",
                  right: "calc(50% / " + node.children.length + ")",
                  height: 1.5,
                  background: node.color + "44",
                }}
              />
            )}
            {node.children.map((child, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 1.5, height: 18, background: child.color + "55" }} />
                <NodeBubble node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MindMapViewer({ docId }: { docId: string }) {
  const router = useRouter();
  const { state } = useDocContext();
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
      <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", gap: 12, padding: "0 18px" }}>
        <button
          onClick={() => router.push(`/document/${docId}/chat`)}
          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4l-5 5 5 5" /></svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>Mind Map</div>
          <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>
            {contextDocs.map((d) => d.short).join(", ")}
          </div>
        </div>
      </div>

      {/* Map canvas */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 24px 48px" }}>
        <NodeBubble node={MAP_DATA} depth={0} />
      </div>
    </main>
  );
}
