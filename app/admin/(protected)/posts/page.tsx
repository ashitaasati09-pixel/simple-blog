import { connectDB } from "@/app/lib/mongodb";
import {Post} from "@/app/models/post";
import AdminPostsClient from "@/app/components/admin/AdminPostsClient";

const POSTS_PER_PAGE = 10;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  await connectDB();

  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const skip = (currentPage - 1) * POSTS_PER_PAGE;

  const [raw, totalCount] = await Promise.all([
    Post.find({}).sort({ createdAt: -1 }).skip(skip).limit(POSTS_PER_PAGE).lean(),
    Post.countDocuments({}),
  ]);

  type RawPost = {
    _id: { toString: () => string }; title: string; content: string; author: string;
    likes?: string[]; comments?: { _id: { toString: () => string }; author: string; text: string }[];
    ipAddress?: string; createdAt?: Date;
  };

  const posts = (raw as unknown as RawPost[]).map((p) => ({
    id: p._id.toString(), title: p.title, content: p.content, author: p.author,
    likesCount: p.likes?.length ?? 0, commentsCount: p.comments?.length ?? 0,
    ip: p.ipAddress || "unknown",
    createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <AdminPostsClient
      posts={posts} totalCount={totalCount}
      currentPage={currentPage} totalPages={totalPages}
    />
  );
}