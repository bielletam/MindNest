import { QuizRunner } from "@/components/quiz/QuizRunner";

export default async function QuizPage(props: PageProps<"/document/[id]/quiz">) {
  const { id } = await props.params;
  return <QuizRunner docId={id} />;
}
