import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import Post from "@/app/models/post";
import AdminUsersClient from "@/app/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  await connectDB();
  const rawUsers = await User.find({}).sort({ createdAt: -1 }).lean();
  const posts = await Post.find({}).lean() as unknown as { author: string }[];

  type RawUser = {
    _id: { toString: () => string };
    username: string;
    email: string;
    bio?: string;
    location?: string;
    ipAddress?: string;
    isBanned?: boolean;
    createdAt?: Date;
  };

  const users = (rawUsers as unknown as RawUser[]).map((u) => ({
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    bio: u.bio || "",
    location: u.location || "",
    ipAddress: u.ipAddress || "unknown",
    isBanned: u.isBanned ?? false,
    postCount: posts.filter((p) => p.author === u.username).length,
    joinedAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return <AdminUsersClient users={users} />;
}