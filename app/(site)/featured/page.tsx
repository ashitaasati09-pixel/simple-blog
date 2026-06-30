// FILE: app/(site)/featured/page.tsx

import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import FeaturedPageClient from "@/app/components/FeaturedPageClient";

const POSTS_PER_PAGE = 5;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function FeaturedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));

  await connectDB();

  // Fix: backfill featuredAt using each post's own createdAt for posts missing it
  // This runs per-document so each gets a unique value
  const missingFeaturedAt = await Post.find({
    featured: true,
    featuredAt: { $exists: false }
  }).lean() as any[];

  for (const p of missingFeaturedAt) {
    await Post.findByIdAndUpdate(p._id, {
      $set: { featuredAt: p.createdAt ?? new Date() }
    });
  }

  const totalCount = await Post.countDocuments({ featured: true });
  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  // Sort by featuredAt desc — most recently featured posts appear first
  const rawPosts = await Post.find({ featured: true })
    .sort({ featuredAt: -1, createdAt: -1 })
    .skip((safePage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
    .lean() as any[];

  const posts = rawPosts.map((p) => ({
    _id: p._id.toString(),
    title: p.title ?? "",
    author: p.author ?? "",
    content: p.content ?? "",
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    likesCount: Array.isArray(p.likes) ? p.likes.length : (p.likesCount ?? 0),
    commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount ?? 0),
    featured: true,
  }));

  return (
    <FeaturedPageClient
      posts={posts}
      currentPage={safePage}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}