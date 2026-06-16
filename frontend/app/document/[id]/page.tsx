import { redirect } from "next/navigation";

export default async function DocumentIndexPage(props: PageProps<"/document/[id]">) {
  const { id } = await props.params;
  redirect(`/document/${id}/chat`);
}
