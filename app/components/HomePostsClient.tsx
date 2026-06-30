/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

import { deletePostAction } from "@/app/lib/actions/post";

interface PostData {
  _id: string; title: string; author: string; content: string;
  createdAt: string; likesCount: number; commentsCount: number; featured?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const WORD_LIMIT = 40;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

function getSnippet(content: string): string {
  const plain = stripHtml(content);
  const words = plain.trim().split(/\s+/);
  if (words.length <= WORD_LIMIT) return plain;
  return words.slice(0, WORD_LIMIT).join(" ") + "\u2026";
}

function getFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function getPaginationPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

export default function HomePostsClient({
  posts,
  currentUsername,
  currentPage,
  totalPages,
  totalCount,
  featuredPosts = [],
}: {
  posts: PostData[];
  currentUsername: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  featuredPosts?: PostData[];
}) {
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const latestFeatured = featuredPosts.length > 0
    ? [...featuredPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  const featuredIds = new Set(featuredPosts.map((p) => p._id));
  const filteredPosts = posts.filter(
    (p) => !featuredIds.has(p._id) && !p.featured
  );

  function handleDelete() {
    if (!deleteTarget?._id) return;
    startTransition(async () => {
      try {
        await deletePostAction(deleteTarget._id);
        router.refresh();
        setDeleteTarget(null);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });
  }

  function goToPost(id: string) {
    router.push("/posts/" + id + "?from=" + pathname);
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    router.push(p === 1 ? "/" : "/?page=" + p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  // Featured card: Title → Image → Snippet → Author → Stats
  function FeaturedCard({ post }: { post: PostData }) {
    const thumbUrl = getFirstImage(post.content);
    const snippet = getSnippet(post.content);

    return (
      <article
        onClick={() => goToPost(post._id)}
        style={{
          background: "#fff",
          border: "2px solid #f97316",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(249,115,22,0.10)",
          transition: "box-shadow 0.2s",
          padding: "24px 28px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(249,115,22,0.18)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.10)")}
      >
        {/* 1. Title */}
        <h2 style={{
          margin: "0 0 18px",
          fontSize: 24, fontWeight: 900,
          color: "#111", lineHeight: 1.25, letterSpacing: "-0.4px",
        }}>
          {post.title}
        </h2>

        {/* 2. Image */}
        {thumbUrl && (
          <div style={{
            width: "100%", height: 340, overflow: "hidden",
            borderRadius: 10, marginBottom: 18, border: "1px solid #f0f0f0",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl} alt={post.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {/* 3. Snippet — below image */}
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6b7280", lineHeight: 1.75 }}>
          {snippet}{" "}
          <span style={{ color: "#f97316", fontWeight: 700, whiteSpace: "nowrap" }}>
            Read more &#8594;
          </span>
        </p>

        {/* 4. Author — below snippet, above likes */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          paddingBottom: 14, borderBottom: "1px solid #f5f5f5", marginBottom: 12,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {post.author[0].toUpperCase()}
          </div>
          <a
            href={"/profile/" + post.author + "?from=" + pathname}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none" }}
          >
            {post.author}
          </a>
          <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(post.createdAt)}</span>
        </div>

        {/* 5. Stats — at very bottom */}
        <div style={{ display: "flex", gap: 18 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>&#10084;&#65039; {post.likesCount}</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>&#128172; {post.commentsCount}</span>
        </div>
      </article>
    );
  }

  // Normal post card
  function PostCard({ post }: { post: PostData }) {
    const isOwner = currentUsername && currentUsername === post.author;
    const initials = post.author?.[0]?.toUpperCase() ?? "?";
    const snippet = getSnippet(post.content);
    const thumbUrl = getFirstImage(post.content);

    return (
      <article style={{
        background: "#fff", border: "1px solid #f0f0f0",
        borderRadius: 12, padding: "22px 24px",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <a
            href={"/profile/" + post.author + "?from=" + pathname}
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#f97316",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{post.author}</span>
            <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(post.createdAt)}</span>
          </a>

          {isOwner && (
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={"/posts/" + post._id + "/edit?from=" + pathname}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", borderRadius: 7,
                  border: "1.5px solid #f97316", color: "#f97316",
                  textDecoration: "none", fontSize: 12, fontWeight: 600,
                }}
              >
                &#9999;&#65039; Edit
              </a>
              <button
                onClick={() => setDeleteTarget(post)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", borderRadius: 7,
                  border: "1.5px solid #fca5a5", background: "transparent",
                  color: "#ef4444", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                &#128465;&#65039; Delete
              </button>
            </div>
          )}
        </div>

        <div
          onClick={() => goToPost(post._id)}
          style={{ cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start" }}
        >
          {thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl} alt={post.title}
              style={{
                width: 110, height: 84, objectFit: "cover",
                borderRadius: 8, flexShrink: 0,
                display: "block", border: "1px solid #f0f0f0",
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: "0 0 8px", fontSize: 17, fontWeight: 800,
              color: "#111", lineHeight: 1.3, letterSpacing: "-0.3px",
            }}>
              {post.title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              {snippet}{" "}
              <span style={{ color: "#f97316", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
                Read more &#8594;
              </span>
            </p>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 18, marginTop: 14,
          paddingTop: 12, borderTop: "1px solid #f5f5f5",
        }}>
          <a
            href={"/posts/" + post._id + "?from=" + pathname}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", textDecoration: "none" }}
          >
            &#10084;&#65039; {post.likesCount}
          </a>
          <a
            href={"/posts/" + post._id + "?from=" + pathname}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", textDecoration: "none" }}
          >
            &#128172; {post.commentsCount}
          </a>
        </div>
      </article>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 24px", boxSizing: "border-box" }}>

      {/* Featured section — page 1 only */}
      {latestFeatured && currentPage === 1 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>
            &#11088; Featured
          </h2>
          <FeaturedCard post={latestFeatured} />
          <div style={{ borderTop: "1px solid #f0f0f0", margin: "32px 0 0" }} />
        </div>
      )}

      {/* All Posts header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
          All Posts
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
          Stories from the community &#8212; newest first.
        </p>
      </div>

      {/* Post list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 15 }}>
            No posts yet.
          </div>
        ) : (
          filteredPosts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 36, marginBottom: 40 }}>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
            Page {currentPage} of {totalPages} &middot; {totalCount} posts total
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>

            {currentPage > 2 && (
              <button onClick={() => goToPage(1)}
                style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>
                &laquo;
              </button>
            )}

            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#f97316"; }}
              onMouseLeave={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              &larr; Prev
            </button>

            {paginationPages.map((pg, i) =>
              pg === "..." ? (
                <span key={"ellipsis-" + i} style={{ padding: "8px 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
              ) : (
                <button key={pg} onClick={() => goToPage(pg as number)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: pg === currentPage ? "none" : "1.5px solid #e5e7eb", background: pg === currentPage ? "#f97316" : "#fff", color: pg === currentPage ? "#fff" : "#374151", fontSize: 13, fontWeight: pg === currentPage ? 700 : 500, cursor: pg === currentPage ? "default" : "pointer", fontFamily: "inherit" }}
                  onMouseEnter={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#f97316"; }}
                  onMouseLeave={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                  {pg}
                </button>
              )
            )}

            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
              style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === totalPages ? "#f9fafb" : "#fff", color: currentPage === totalPages ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = "#f97316"; }}
              onMouseLeave={(e) => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              Next &rarr;
            </button>

            {currentPage < totalPages - 1 && (
              <button onClick={() => goToPage(totalPages)}
                style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>
                &raquo;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "36px 32px",
            maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: "#fef2f2",
              border: "1px solid #fca5a5", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, marginBottom: 16,
            }}>
              &#128465;&#65039;
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
              Delete this post?
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 }}>
              This action cannot be undone.
            </p>
            <div style={{
              background: "#f9fafb", borderRadius: 8, padding: "10px 14px",
              marginBottom: 24, border: "1px solid #f0f0f0",
            }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Post</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{deleteTarget.title}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDelete} disabled={isPending}
                style={{ flex: 1, padding: "12px", background: isPending ? "#fca5a5" : "#dc2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "'Segoe UI', sans-serif" }}>
                {isPending ? "Deleting\u2026" : "Yes, delete it"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={isPending}
                style={{ flex: 1, padding: "12px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Segoe UI', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}