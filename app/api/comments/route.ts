import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";

const LIMIT = 5; // comments per page

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId")?.trim();
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10));

  if (!postId) {
    return NextResponse.json(
      { error: "postId is required" },
      { status: 400 }
    );
  }

  await connectDB();

  type RawComment = {
    _id: { toString: () => string };
    author: string;
    text: string;
    createdAt?: Date;
  };
  type RawPost = {
    _id: { toString: () => string };
    comments?: RawComment[];
  };

  const raw = await Post.findById(postId)
    .select("comments")
    .lean();

  if (!raw) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    );
  }

  const post = raw as unknown as RawPost;
  const allComments = (post.comments ?? []).map((c) => ({
    id: c._id.toString(),
    author: c.author,
    text: c.text,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const commentTotal = allComments.length;
  const commentTotalPages = Math.max(1, Math.ceil(commentTotal / LIMIT));
  const safePage = Math.min(page, commentTotalPages);
  const skip = (safePage - 1) * LIMIT;
  const paginatedComments = allComments.slice(skip, skip + LIMIT);

  return NextResponse.json({
    comments: paginatedComments,
    commentTotal,
    commentTotalPages,
    page: safePage,
  });
}