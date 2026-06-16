import { SummaryView } from "@/components/summary/SummaryView";

export default async function SummaryPage(props: PageProps<"/document/[id]/summary">) {
  const { id } = await props.params;
  return <SummaryView docId={id} />;
}
