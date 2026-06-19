import { notFound } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
import User from "@/app/models/user";
import UserProfileClient from "@/app/components/UserProfileClient";

interface PostData {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { username } = await params;
  const { from } = await searchParams;
  const backUrl = from ?? "/";

  await connectDB();

  const rawUser = await User.findOne({ username }).lean();
  if (!rawUser) notFound();

  const profileUser = rawUser as unknown as {
    username: string;
    email: string;
    bio?: string;
    location?: string;
    avatarColor?: string;
    createdAt?: Date;
  };

  const rawPosts = await Post.find({ author: username })
    .sort({ createdAt: -1 })
    .lean();

  const posts: PostData[] = rawPosts.map((p) => {
    const post = p as unknown as {
      _id: { toString: () => string };
      title: string;
      content: string;
      likes?: string[];
      comments?: unknown[];
      createdAt?: Date;
    };
    return {
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
      likesCount: post.likes?.length ?? 0,
      commentsCount: post.comments?.length ?? 0,
    };
  });

  const sessionUser = await getSessionUser();
  const isOwner = sessionUser?.username === username;

  return (
    <UserProfileClient
      profile={{
        username: profileUser.username,
        bio: profileUser.bio ?? "",
        location: profileUser.location ?? "",
        avatarColor: profileUser.avatarColor ?? "#f97316",
        joinedAt: profileUser.createdAt?.toISOString() ?? new Date().toISOString(),
      }}
      posts={posts}
      isOwner={isOwner}
      backUrl={backUrl}
    />
  );
}