import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import {Post} from "@/app/models/post";
import MyPostsClient from "@/app/components/MyPostsClient";

interface PostData {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default async function MyPostsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await connectDB();
  const rawPosts = await Post.find({ author: user.username })
    .sort({ createdAt: -1 })
    .lean();

  const posts: PostData[] = rawPosts.map((p) => {
    const post = p as {
      _id: { toString: () => string };
      title: string;
      content: string;
      createdAt?: Date;
    };
    return {
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  });

  return <MyPostsClient posts={posts} username={user.username} />;
}