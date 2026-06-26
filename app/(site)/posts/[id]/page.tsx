import { notFound } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import PostDetailClient from "@/app/components/PostDetailClient";

const COMMENTS_PER_PAGE = 5;

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // Safely extract as plain strings — handle array case too
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const rawFrom = Array.isArray(sp.from) ? sp.from[0] : sp.from;

  const backUrl = rawFrom ?? "/";
  const currentPage = Math.max(1, parseInt(rawPage ?? "1", 10));

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

  // Map all comments to plain objects
  const allComments = (post.comments ?? []).map((c) => ({
    _id: c._id.toString(),
    author: c.author,
    text: c.text,
    createdAt: c.createdAt?.toISOString
      ? c.createdAt.toISOString()
      : new Date(c.createdAt).toISOString(),
  }));

  const commentTotal = allComments.length;
  const commentTotalPages = Math.max(1, Math.ceil(commentTotal / COMMENTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), commentTotalPages);

  // Exact slice for this page only
  const startIndex = (safePage - 1) * COMMENTS_PER_PAGE;
  const paginatedComments = allComments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);

  return (
    <PostDetailClient
      post={{
        _id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: post.author,
        createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
        likes: post.likes ?? [],
        comments: paginatedComments,
      }}
      currentUsername={sessionUser?.username ?? null}
      backUrl={backUrl}
      commentTotal={commentTotal}
      commentTotalPages={commentTotalPages}
      commentCurrentPage={safePage}
    />
  );
}