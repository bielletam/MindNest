import { FlashcardsView } from "@/components/flashcards/FlashcardsView";

export default async function FlashcardsPage(props: PageProps<"/document/[id]/flashcards">) {
  const { id } = await props.params;
  return <FlashcardsView docId={id} />;
}
