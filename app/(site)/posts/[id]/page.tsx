import { notFound } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
import PostDetailClient from "@/app/components/PostDetailClient";

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backUrl = from ?? "/";

  await connectDB();
  const raw = await Post.findById(id).lean();
  if (!raw) notFound();

  const post = raw as unknown as {
    _id: { toString: () => string };
    title: string;
    content: string;
    author: string;
    likes: string[];
    comments: {
      _id: { toString: () => string };
      author: string;
      text: string;
      createdAt: Date;
    }[];
    createdAt?: Date;
  };

  const sessionUser = await getSessionUser();

  return (
    <PostDetailClient
      post={{
        _id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: post.author,
        createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
        likes: post.likes ?? [],
        comments: (post.comments ?? []).map((c) => ({
          _id: c._id.toString(),
          author: c.author,
          text: c.text,
          createdAt: c.createdAt.toISOString
            ? c.createdAt.toISOString()
            : new Date(c.createdAt).toISOString(),
        })),
      }}
      currentUsername={sessionUser?.username ?? null}
      backUrl={backUrl}
    />
  );
}