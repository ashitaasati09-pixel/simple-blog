import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
import AdminPostsClient from "@/app/components/admin/AdminPostsClient";

export default async function AdminPostsPage() {
  await connectDB();
  const raw = await Post.find({}).sort({ createdAt: -1 }).lean();

  type RawPost = {
    _id: { toString: () => string };
    title: string;
    content: string;
    author: string;
    likes?: string[];
    comments?: { _id: { toString: () => string }; author: string; text: string }[];
    ipAddress?: string;
    createdAt?: Date;
  };

  const posts = (raw as unknown as RawPost[]).map((p) => ({
    id: p._id.toString(),
    title: p.title,
    content: p.content,
    author: p.author,
    likesCount: p.likes?.length ?? 0,
    commentsCount: p.comments?.length ?? 0,
    ip: p.ipAddress || "unknown",
    createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return <AdminPostsClient posts={posts} />;
}