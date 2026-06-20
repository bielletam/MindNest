"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MindMap, MindMapWithData } from "@/lib/types";
import { GenerationScopePicker } from "./GenerationScopePicker";
import { MindMapViewer } from "./MindMapViewer";

interface Props {
  docId: string;
}

export function MindMapView({ docId }: Props) {
  const [mindmaps, setMindmaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [activeMM, setActiveMM] = useState<MindMapWithData | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    api.fetchMindMaps(docId)
      .then(setMindmaps)
      .catch(() => setListError("Failed to load mind maps."))
      .finally(() => setLoading(false));
  }, [docId]);

  function handleGenerated(mm: MindMapWithData) {
    setMindmaps((prev) => [
      {
        id: mm.id,
        document_id: mm.document_id,
        title: mm.title,
        scope_description: mm.scope_description,
        created_at: mm.created_at,
        node_count: mm.nodes.length,
        edge_count: mm.edges.length,
      },
      ...prev,
    ]);
    setActiveMM(mm);
  }

  async function openMindMap(id: string) {
    setFetching(true);
    try {
      const mm = await api.fetchMindMap(id);
      setActiveMM(mm);
    } catch {
      setListError("Failed to load mind map.");
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMindMap(id);
      setMindmaps((prev) => prev.filter((m) => m.id !== id));
      if (activeMM?.id === id) setActiveMM(null);
    } catch {
      setListError("Failed to delete mind map.");
    }
  }

  // Viewer mode — full panel
  if (activeMM) {
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 18 }}>
        <MindMapViewer mindmap={activeMM} onBack={() => setActiveMM(null)} />
      </div>
    );
  }

  // List mode
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 14, padding: 18, overflowY: "auto" }}>
      <GenerationScopePicker docId={docId} onGenerated={handleGenerated} />

      {loading && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--mn-text-3)", fontSize: 13 }}>
          Loading…
        </div>
      )}
      {listError && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "9px 14px", color: "#fca5a5", fontSize: 13 }}>
          {listError}
        </div>
      )}
      {!loading && mindmaps.length === 0 && !listError && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--mn-text-3)", fontSize: 13 }}>
          No mind maps yet. Generate one above.
        </div>
      )}
      {mindmaps.map((mm) => (
        <MindMapCard
          key={mm.id}
          mindmap={mm}
          onView={() => openMindMap(mm.id)}
          onDelete={() => handleDelete(mm.id)}
          loading={fetching}
        />
      ))}
    </div>
  );
}

// ── Mind map list card ────────────────────────────────────────────────────────

function MindMapCard({
  mindmap, onView, onDelete, loading,
}: {
  mindmap: MindMap;
  onView: () => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const date = new Date(mindmap.created_at).toLocaleDateString(undefined, {
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
      {/* Icon */}
      <div
        style={{
          flexShrink: 0, width: 38, height: 38, borderRadius: 10,
          background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#818cf8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="5" r="2.2"/>
          <circle cx="4" cy="14" r="2.2"/>
          <circle cx="16" cy="14" r="2.2"/>
          <line x1="10" y1="7.2" x2="4.9" y2="12.2"/>
          <line x1="10" y1="7.2" x2="15.1" y2="12.2"/>
        </svg>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {mindmap.title ?? "Mind Map"}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
          {mindmap.scope_description && (
            <span style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{mindmap.scope_description}</span>
          )}
          <span style={{ fontSize: 11.5, color: "#56627a" }}>
            {mindmap.node_count} node{mindmap.node_count !== 1 ? "s" : ""}
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
              onClick={onView}
              disabled={loading}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "none",
                background: "var(--mn-accent-grad)", color: "#fff",
                fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 2px 8px var(--mn-accent-ring)",
              }}
            >
              View
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
