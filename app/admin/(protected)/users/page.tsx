import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import { Post } from "@/app/models/post";
import AdminUsersClient from "@/app/components/admin/AdminUsersClient";

const USERS_PER_PAGE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  await connectDB();

  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const skip = (currentPage - 1) * USERS_PER_PAGE;

  const [rawUsers, totalCount, posts] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).skip(skip).limit(USERS_PER_PAGE).lean(),
    User.countDocuments({}),
    Post.find({}).select("author").lean() as Promise<{ author: string }[]>,
  ]);

  type RawUser = {
    _id: { toString: () => string }; username: string; email: string;
    bio?: string; location?: string; ipAddress?: string; isBanned?: boolean; createdAt?: Date;
  };

  const users = (rawUsers as unknown as RawUser[]).map((u) => ({
    id: u._id.toString(), username: u.username, email: u.email,
    bio: u.bio || "", location: u.location || "",
    ipAddress: u.ipAddress || "unknown", isBanned: u.isBanned ?? false,
    postCount: posts.filter((p) => p.author === u.username).length,
    joinedAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

  return (
    <AdminUsersClient
      users={users} totalCount={totalCount}
      currentPage={currentPage} totalPages={totalPages}
    />
  );
}