import { ChatPageView } from "@/components/chat/ChatPageView";

export default async function ChatPage(props: PageProps<"/document/[id]/chat">) {
  const { id } = await props.params;
  return <ChatPageView docId={id} />;
}
