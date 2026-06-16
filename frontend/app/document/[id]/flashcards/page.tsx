import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";

export default async function FlashcardsPage(props: PageProps<"/document/[id]/flashcards">) {
  const { id } = await props.params;
  return <FlashcardDeck docId={id} />;
}
