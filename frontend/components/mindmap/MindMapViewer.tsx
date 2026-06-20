"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { toPng } from "html-to-image";
import type { MindMapWithData } from "@/lib/types";

const NODE_W = 180;
const NODE_H = 56;

type NData = { label: string; description: string | null; node_type: "root" | "branch" | "leaf" };

function MapNode({ data }: NodeProps) {
  const { label, description, node_type } = data as NData;

  const styles: Record<string, React.CSSProperties> = {
    root: {
      background: "var(--mn-accent-grad)",
      border: "none",
      color: "#fff",
      fontSize: 14,
      fontWeight: 800,
      boxShadow: "0 4px 18px var(--mn-accent-ring)",
    },
    branch: {
      background: "rgba(99,102,241,.15)",
      border: "1.5px solid rgba(99,102,241,.45)",
      color: "#a5b4fc",
      fontSize: 13,
      fontWeight: 700,
    },
    leaf: {
      background: "var(--mn-surface-2)",
      border: "1.5px solid var(--mn-border-2)",
      color: "#cbd5e1",
      fontSize: 12,
      fontWeight: 600,
    },
  };

  const s = styles[node_type] ?? styles.leaf;

  return (
    <div
      title={description ?? undefined}
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        padding: "10px 14px",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        lineHeight: 1.3,
        cursor: description ? "help" : "default",
        ...s,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      {label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const NODE_TYPES = { mapNode: MapNode };

function buildGraph(mm: MindMapWithData): { nodes: Node[]; edges: Edge[] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 90, nodesep: 55 });

  mm.nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  mm.edges.forEach((e) => g.setEdge(e.source_node_id, e.target_node_id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dagre as any).layout(g);

  const nodes: Node[] = mm.nodes.map((n) => {
    const pos = g.node(n.id) as { x: number; y: number };
    return {
      id: n.id,
      type: "mapNode",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { label: n.label, description: n.description, node_type: n.node_type } as NData,
    };
  });

  const edges: Edge[] = mm.edges.map((e) => ({
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    label: e.relationship_label,
    type: "smoothstep",
    style: { stroke: "#334155", strokeWidth: 1.5 },
    labelStyle: { fill: "#64748b", fontSize: 10, fontFamily: "inherit" },
    labelBgStyle: { fill: "transparent" },
    labelBgPadding: [2, 4] as [number, number],
  }));

  return { nodes, edges };
}

interface Props {
  mindmap: MindMapWithData;
  onBack?: () => void;
}

export function MindMapViewer({ mindmap, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes, edges } = useMemo(() => buildGraph(mindmap), [mindmap]);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        backgroundColor: "#0f172a",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(mindmap.title ?? "mindmap").replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (e) {
      console.error("PNG export failed:", e);
    }
  }, [mindmap.title]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, gap: 10 }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 10,
          background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
          borderRadius: 14, padding: "10px 14px",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              border: "1px solid var(--mn-border-2)",
              background: "transparent", color: "var(--mn-text-3)",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: ".15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L5 7l4 5" />
            </svg>
            Back
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {mindmap.title ?? "Mind Map"}
          </div>
          {mindmap.scope_description && (
            <div style={{ fontSize: 11.5, color: "var(--mn-text-3)", marginTop: 1 }}>
              {mindmap.scope_description} · {mindmap.node_count} nodes
            </div>
          )}
        </div>

        <button
          onClick={handleDownload}
          style={{
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            padding: "6px 14px", borderRadius: 9,
            border: "1px solid var(--mn-border-2)", background: "transparent",
            color: "#94a3b8", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: ".15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v9M5 8l3 3 3-3"/><path d="M2 13h12"/>
          </svg>
          Download PNG
        </button>
      </div>

      {/* React Flow canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1, minHeight: 0, borderRadius: 16, overflow: "hidden",
          border: "1px solid var(--mn-border)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--mn-surface)" }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background color="#1e293b" gap={24} />
          <Controls />
          <style>{`
            .react-flow__controls {
              background: var(--mn-surface-2) !important;
              border: 1px solid var(--mn-border-2) !important;
              border-radius: 10px !important;
              box-shadow: none !important;
            }
            .react-flow__controls-button {
              background: transparent !important;
              border-bottom: 1px solid var(--mn-border-2) !important;
              color: #94a3b8 !important;
              fill: #94a3b8 !important;
            }
            .react-flow__controls-button:last-child {
              border-bottom: none !important;
            }
            .react-flow__controls-button:hover {
              background: var(--mn-surface) !important;
              color: #e2e8f0 !important;
              fill: #e2e8f0 !important;
            }
            .react-flow__controls-button svg {
              fill: inherit !important;
            }
          `}</style>
        </ReactFlow>
      </div>
    </div>
  );
}
