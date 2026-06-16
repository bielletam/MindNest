import { MindMapViewer } from "@/components/mindmap/MindMapViewer";

export default async function MindMapPage(props: PageProps<"/document/[id]/mindmap">) {
  const { id } = await props.params;
  return <MindMapViewer docId={id} />;
}
