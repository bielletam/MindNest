"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) return;
    // In real app: call api.uploadDocument(file), get back id, navigate
    // For now, navigate to demo document
    router.push("/document/sleep/chat");
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        padding: "48px 32px", borderRadius: 20, cursor: "pointer", textAlign: "center",
        border: drag ? "2px dashed var(--mn-accent)" : "2px dashed rgba(148,163,184,.2)",
        background: drag ? "var(--mn-accent-soft)" : "var(--mn-surface-2)",
        transition: ".18s", width: "100%", maxWidth: 440,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div
        style={{
          width: 52, height: 52, borderRadius: 16,
          background: "var(--mn-accent-soft)", color: "#818cf8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V8" /><path d="M8 12l4-4 4 4" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
          Drop a PDF here
        </div>
        <div style={{ fontSize: 13.5, color: "var(--mn-text-2)" }}>
          or <span style={{ color: "#818cf8", fontWeight: 600 }}>browse your files</span>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>PDF up to 50 MB</div>
    </label>
  );
}
