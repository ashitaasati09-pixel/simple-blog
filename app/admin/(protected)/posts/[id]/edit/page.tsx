import { notFound } from "next/navigation";
import { adminGetPostAction } from "@/app/lib/actions/admin";
import AdminEditPostClient from "@/app/components/admin/AdminEditPostClient";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await adminGetPostAction(id);

  if (!raw) notFound();

  type RawPost = {
    _id: { toString: () => string };
    title: string;
    content: string;
    author: string;
  };
  const post = raw as unknown as RawPost;

  return (
    <AdminEditPostClient
      postId={post._id.toString()}
      title={post.title}
      content={post.content}
      author={post.author}
    />
  );
}