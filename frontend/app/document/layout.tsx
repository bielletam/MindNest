import type { ReactNode } from "react";
import { DocumentProvider } from "@/lib/document-context";

export default function DocumentRootLayout({ children }: { children: ReactNode }) {
  return <DocumentProvider>{children}</DocumentProvider>;
}
