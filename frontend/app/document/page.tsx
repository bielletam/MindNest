import { DocumentShell } from "@/components/DocumentShell";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function DocumentHomePage() {
  return (
    <DocumentShell docId="">
      <ChatWindow docId="" />
    </DocumentShell>
  );
}
