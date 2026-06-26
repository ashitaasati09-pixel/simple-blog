import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import HomePostsClient from "@/app/components/HomePostsClient";

const POSTS_PER_PAGE = 5;

interface PostData {
  _id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const user = await getSessionUser();

  await connectDB();

  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const skip = (currentPage - 1) * POSTS_PER_PAGE;

  const [rawPosts, totalCount] = await Promise.all([
    Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(POSTS_PER_PAGE)
      .lean(),
    Post.countDocuments({}),
  ]);

  const posts: PostData[] = rawPosts.map((p) => {
    const post = p as unknown as {
      _id: { toString: () => string };
      title: string;
      content: string;
      author: string;
      likes?: string[];
      comments?: unknown[];
      createdAt?: Date;
    };
    return {
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
      likesCount: post.likes?.length ?? 0,
      commentsCount: post.comments?.length ?? 0,
    };
  });

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>
          All Posts
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
          Stories from the community — newest first.
        </p>
      </div>

      <HomePostsClient
        posts={posts}
        currentUsername={user?.username ?? null}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </main>
  );
}