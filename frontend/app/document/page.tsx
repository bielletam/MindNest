import { DocumentShell } from "@/components/DocumentShell";
import { ChatPageView } from "@/components/chat/ChatPageView";

export default function DocumentHomePage() {
  return (
    <DocumentShell docId="">
      <ChatPageView docId="" />
    </DocumentShell>
  );
}
