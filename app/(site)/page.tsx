import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import HomePostsClient from "@/app/components/HomePostsClient";

const POSTS_PER_PAGE = 5;

interface PostData {
  _id: string; title: string; author: string; content: string;
  createdAt: string; likesCount: number; commentsCount: number; featured?: boolean;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const user = await getSessionUser();

  await connectDB();

  // Backfill: set featuredAt = createdAt per-document for any missing it
  const missingFeaturedAt = await Post.find({
    featured: true,
    featuredAt: { $exists: false }
  }).lean() as any[];

  for (const p of missingFeaturedAt) {
    await Post.findByIdAndUpdate(p._id, {
      $set: { featuredAt: p.createdAt ?? new Date() }
    });
  }

  const currentPage = Math.max(1, parseInt(page || "1", 10));

  // Fetch the most recently featured post (featuredAt desc)
  const rawFeatured = await Post.find({ featured: true })
    .sort({ featuredAt: -1 })
    .limit(1)
    .lean();

  const featuredId: string | null =
    rawFeatured.length > 0
      ? (rawFeatured[0]._id as { toString: () => string }).toString()
      : null;

  // All regular posts exclude ALL featured posts
  const regularQuery = featuredId
    ? { _id: { $ne: featuredId }, featured: { $ne: true } }
    : {};

  const totalRegular = await Post.countDocuments(regularQuery);
  const totalPages = Math.max(1, Math.ceil(totalRegular / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const skip = (safePage - 1) * POSTS_PER_PAGE;

  const rawPosts = await Post.find(regularQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(POSTS_PER_PAGE)
    .lean();

  type RawPost = {
    _id: { toString: () => string }; title: string; content: string;
    author: string; likes?: string[]; comments?: unknown[];
    createdAt?: Date; featured?: boolean;
  };

  function mapPost(p: unknown): PostData {
    const post = p as RawPost;
    return {
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
      likesCount: post.likes?.length ?? 0,
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
      featured: post.featured ?? false,
    };
  }

  const posts = rawPosts.map(mapPost);
  const featuredPosts = (rawFeatured as unknown[]).map(mapPost);
  const totalCount = totalRegular;

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
      <HomePostsClient
        posts={posts}
        featuredPosts={featuredPosts}
        currentUsername={user?.username ?? null}
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </main>
  );
}