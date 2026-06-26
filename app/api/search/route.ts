import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import User from "@/app/models/user";

const LIMIT = 5; // posts per page

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10));

  if (!q || q.length < 1) {
    return NextResponse.json({
      posts: [], authors: [],
      postTotal: 0, postTotalPages: 0, page: 1,
    });
  }

  await connectDB();
  const regex = { $regex: q, $options: "i" };
  const skip = (page - 1) * LIMIT;

  type RawPost = {
    _id: { toString: () => string };
    title: string; content: string; author: string; createdAt?: Date;
  };
  type RawUser = {
    _id: { toString: () => string };
    username: string; bio?: string;
  };

  // Run all queries in parallel:
  // - Authors: always all matches, only on page 1
  // - Count title matches and content-only matches (for pagination total)
  // - Fetch the right page of results using priority ordering
  //
  // Priority: title matches come before content-only matches.
  // We handle this by:
  //   1. Count title matches → tells us how many "slots" title matches fill
  //   2. If skip is within title matches → fetch from title matches (+ spillover from content)
  //   3. If skip is beyond title matches → fetch from content-only matches
  const [
    authorDocs,
    titleTotalCount,
    contentOnlyTotalCount,
  ] = await Promise.all([
    page === 1
      ? User.find({ username: regex }).select("username bio").limit(5).lean()
      : Promise.resolve([]),
    Post.countDocuments({ title: regex }),
    Post.countDocuments({ title: { $not: regex }, content: regex }),
  ]);

  const postTotal = titleTotalCount + contentOnlyTotalCount;
  const postTotalPages = Math.ceil(postTotal / LIMIT);

  // ── Fetch the correct page with priority ordering ────────────────────────
  // We need to fill up to LIMIT posts for this page.
  // Title matches have higher priority → fill from them first.
  let posts: RawPost[] = [];

  if (skip < titleTotalCount) {
    // Some (or all) of this page comes from title matches
    const titleSkip = skip;
    const titleLimit = Math.min(LIMIT, titleTotalCount - titleSkip);

    const titleDocs = await Post.find({ title: regex })
      .select("title content author createdAt")
      .sort({ createdAt: -1 })
      .skip(titleSkip)
      .limit(titleLimit)
      .lean();

    posts = titleDocs as unknown as RawPost[];

    // If title matches filled less than LIMIT, top up from content-only
    const remaining = LIMIT - posts.length;
    if (remaining > 0 && contentOnlyTotalCount > 0) {
      const contentDocs = await Post.find({ title: { $not: regex }, content: regex })
        .select("title content author createdAt")
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(remaining)
        .lean();
      posts = [...posts, ...(contentDocs as unknown as RawPost[])];
    }
  } else {
    // This page is entirely from content-only matches
    const contentSkip = skip - titleTotalCount;
    const contentDocs = await Post.find({ title: { $not: regex }, content: regex })
      .select("title content author createdAt")
      .sort({ createdAt: -1 })
      .skip(contentSkip)
      .limit(LIMIT)
      .lean();
    posts = contentDocs as unknown as RawPost[];
  }

  return NextResponse.json({
    authors: (authorDocs as unknown as RawUser[]).map((u) => ({
      id: u._id.toString(),
      username: u.username,
      bio: u.bio ? stripHtml(u.bio).slice(0, 100) : "",
    })),
    posts: posts.map((p) => ({
      id: p._id.toString(),
      title: stripHtml(p.title),
      snippet: stripHtml(p.content).slice(0, 200),
      author: p.author,
      createdAt: p.createdAt?.toISOString() ?? "",
    })),
    postTotal,       
    postTotalPages,  
    page,           
  });
}