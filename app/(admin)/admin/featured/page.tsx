// FILE: app/(admin)/admin/featured/page.tsx

import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import AdminFeaturedClient from "@/app/components/AdminFeaturedClient";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import { requireAdmin } from "@/app/lib/admin-auth";

const POSTS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminFeaturedPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));

  await connectDB();

  // Only fetch featured posts
  const totalCount = await Post.countDocuments({ featured: true });
  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const rawPosts = await Post.find({ featured: true })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
    .lean() as any[];

  const posts = rawPosts.map((p) => ({
    id: p._id.toString(),
    title: p.title ?? "",
    author: p.author ?? "",
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    likesCount: Array.isArray(p.likes) ? p.likes.length : (p.likesCount ?? 0),
    commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount ?? 0),
    featured: true,
  }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <AdminSidebar username={admin.username} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <AdminFeaturedClient
          posts={posts}
          currentPage={safePage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}