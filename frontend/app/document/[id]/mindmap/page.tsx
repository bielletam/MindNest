import { MindMapView } from "@/components/mindmap/MindMapView";

export default async function MindMapPage(props: PageProps<"/document/[id]/mindmap">) {
  const { id } = await props.params;
  return <MindMapView docId={id} />;
}
