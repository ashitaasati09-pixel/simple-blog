"use client";
import { useRouter, usePathname } from "next/navigation";

interface PostData {
  _id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  featured?: boolean;
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

function PostCard({ post, onNavigate }: { post: PostData; onNavigate: (id: string) => void }) {
  const pathname = usePathname();
  const snippet = getSnippet(post.content);
  const thumbUrl = getFirstImage(post.content);

  return (
    <article style={{
      background: "#fff", border: "1px solid #f0f0f0",
      borderRadius: 12, padding: "22px 24px",
    }}>
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <a
          href={"/profile/" + post.author + "?from=" + pathname}
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {post.author[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{post.author}</span>
          <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(post.createdAt)}</span>
        </a>
      </div>

      {/* Clickable: thumbnail left + title/snippet right */}
      <div
        onClick={() => onNavigate(post._id)}
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

      {/* Likes / comments */}
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

export default function FeaturedPageClient({
  posts,
  currentPage,
  totalPages,
  totalCount,
}: {
  posts: PostData[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();

  function goToPost(id: string) {
    router.push("/posts/" + id + "?from=/featured");
  }

  function goToPage(p: number) {
    router.push(p === 1 ? "/featured" : "/featured?page=" + p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 24px",
          background: "#fff", borderRadius: 16, border: "2px dashed #f97316",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#11088;</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
            No featured posts yet
          </h2>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
            Check back soon — our editors are curating the best stories.
          </p>
        </div>
      )}

      {/* Post list — same style as home page All Posts */}
      {posts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onNavigate={goToPost} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 36, marginBottom: 40 }}>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
            Page {currentPage} of {totalPages} &middot; {totalCount} featured posts
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
    </div>
  );
}