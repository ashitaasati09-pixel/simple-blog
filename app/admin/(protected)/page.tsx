import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
import User from "@/app/models/user";
import AdminDashboardClient from "@/app/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  await connectDB();

  const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
  const users = await User.find({}).lean();

  type RawPost = {
    _id: { toString: () => string };
    title: string;
    author: string;
    likes?: string[];
    comments?: unknown[];
    ipAddress?: string;
    createdAt?: Date;
  };

  const typedPosts = posts as unknown as RawPost[];
  const totalPosts = typedPosts.length;
  const totalLikes = typedPosts.reduce((s, p) => s + (p.likes?.length ?? 0), 0);
  const totalComments = typedPosts.reduce((s, p) => s + (p.comments?.length ?? 0), 0);
  const totalUsers = users.length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const days: { date: string; posts: number; likes: number; comments: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      posts: 0,
      likes: 0,
      comments: 0,
    });
  }

  for (const p of typedPosts) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    const created = p.createdAt ? new Date(p.createdAt) : fallback;
    created.setHours(0, 0, 0, 0);
    const diff = Math.round((now.getTime() - created.getTime()) / 86400000);
    const idx = 13 - diff;
    if (idx >= 0 && idx <= 13) {
      days[idx].posts++;
      days[idx].likes += p.likes?.length ?? 0;
      days[idx].comments += p.comments?.length ?? 0;
    }
  }

  const topPosts = typedPosts
    .map((p) => ({
      id: p._id.toString(),
      title: p.title,
      author: p.author,
      likes: p.likes?.length ?? 0,
      comments: p.comments?.length ?? 0,
    }))
    .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
    .slice(0, 5);

  const ipLog = typedPosts.slice(0, 20).map((p) => {
    const fallback = new Date();
    return {
      id: p._id.toString(),
      title: p.title,
      author: p.author,
      ip: p.ipAddress || "unknown",
      createdAt: p.createdAt?.toISOString() ?? fallback.toISOString(),
    };
  });

  const authorCounts: Record<string, number> = {};
  for (const p of typedPosts) {
    authorCounts[p.author] = (authorCounts[p.author] ?? 0) + 1;
  }
  const postsByAuthor = Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <AdminDashboardClient
      totals={{ totalPosts, totalLikes, totalComments, totalUsers }}
      dailyStats={days}
      topPosts={topPosts}
      ipLog={ipLog}
      postsByAuthor={postsByAuthor}
    />
  );
}