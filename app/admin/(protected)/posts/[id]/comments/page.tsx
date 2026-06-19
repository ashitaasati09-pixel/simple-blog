import { notFound } from "next/navigation";
import { adminGetPostWithCommentsAction } from "@/app/lib/actions/admin";
import AdminCommentsClient from "@/app/components/admin/AdminCommentsClient";

export default async function AdminPostCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await adminGetPostWithCommentsAction(id);

  if (!raw) notFound();

  type RawComment = {
    _id: { toString: () => string };
    author: string;
    text: string;
    createdAt?: Date;
  };
  type RawPost = {
    _id: { toString: () => string };
    title: string;
    author: string;
    comments?: RawComment[];
  };

  const post = raw as unknown as RawPost;

  const comments = (post.comments ?? []).map((c) => ({
    id: c._id.toString(),
    author: c.author,
    text: c.text,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <AdminCommentsClient
      postId={post._id.toString()}
      postTitle={post.title}
      postAuthor={post.author}
      comments={comments}
    />
  );
}