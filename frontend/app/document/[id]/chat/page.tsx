import { ChatWindow } from "@/components/chat/ChatWindow";

export default async function ChatPage(props: PageProps<"/document/[id]/chat">) {
  const { id } = await props.params;
  return <ChatWindow docId={id} />;
}
