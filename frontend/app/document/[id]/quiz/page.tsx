import { QuizView } from "@/components/quiz/QuizView";

export default async function QuizPage(props: PageProps<"/document/[id]/quiz">) {
  const { id } = await props.params;
  return <QuizView docId={id} />;
}
