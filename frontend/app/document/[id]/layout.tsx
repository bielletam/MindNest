import type { ReactNode } from "react";
import { DocumentShell } from "@/components/DocumentShell";

export default async function DocumentLayout(props: LayoutProps<"/document/[id]">) {
  const { id } = await props.params;
  return <DocumentShell docId={id}>{props.children}</DocumentShell>;
}
