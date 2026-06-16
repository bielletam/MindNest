"use client";

import { useEffect, type ReactNode } from "react";
import { useDocContext } from "@/lib/document-context";
import { Sidebar } from "@/components/Sidebar";
import { PDFViewer } from "@/components/PDFViewer";

interface DocumentShellProps {
  docId: string;
  children: ReactNode;
}

export function DocumentShell({ docId, children }: DocumentShellProps) {
  const { dispatch } = useDocContext();

  // Sync the route's docId into context whenever it changes (e.g. after upload navigates to new doc).
  useEffect(() => {
    dispatch({ type: "OPEN_DOC", payload: docId });
  }, [docId, dispatch]);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        background: "var(--mn-bg)",
      }}
    >
      <Sidebar docId={docId} />
      {children}
      <PDFViewer />
    </div>
  );
}
