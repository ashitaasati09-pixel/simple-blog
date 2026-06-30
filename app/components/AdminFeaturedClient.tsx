"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleFeaturedAction } from "@/app/lib/actions/admin-featured";

interface PostData {
  id: string; title: string; author: string;
  likesCount: number; commentsCount: number; createdAt: string; featured: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getPaginationPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
  else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

export default function AdminFeaturedClient({
  posts: initialPosts, totalCount, currentPage, totalPages,
}: {
  posts: PostData[]; totalCount: number; currentPage: number; totalPages: number;
}) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { setPosts(initialPosts); }, [initialPosts]);

  async function handleUnfeature(post: PostData) {
    if (loadingId) return;
    setLoadingId(post.id);
    const result = await toggleFeaturedAction(post.id, false);
    if (result.error) {
      alert(result.error);
      setLoadingId(null);
      return;
    }
    // Remove from list since it's no longer featured
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setLoadingId(null);
    router.refresh();
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    router.push(p === 1 ? "/admin/featured" : `/admin/featured?page=${p}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div style={{ padding: "32px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
          Featured
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          {totalCount} featured post{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Title", "Author", "❤️", "💬", "Date", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "60px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  No featured posts yet. Go to Posts to feature some.
                </td>
              </tr>
            ) : posts.map((post) => {
              const isLoading = loadingId === post.id;
              return (
                <tr key={post.id}
                  style={{ borderBottom: "1px solid #f5f5f5", background: "#fffbf5" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fffbf5")}
                >
                  {/* Title */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "#f97316" }}>⭐</span>
                      <span style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>
                        {post.title.length > 50 ? post.title.slice(0, 50) + "..." : post.title}
                      </span>
                    </div>
                  </td>

                  {/* Author */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: "#f97316", fontWeight: 600 }}>{post.author}</span>
                  </td>

                  {/* Likes */}
                  <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>
                    {post.likesCount}
                  </td>

                  {/* Comments */}
                  <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>
                    {post.commentsCount}
                  </td>

                  {/* Date */}
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                    {formatDate(post.createdAt)}
                  </td>

                  {/* Unfeature button only */}
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleUnfeature(post)}
                      disabled={isLoading}
                      style={{
                        padding: "5px 14px",
                        border: "1.5px solid #f97316",
                        borderRadius: 6,
                        background: "#fff7ed",
                        color: "#f97316",
                        fontSize: 11, fontWeight: 700,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        opacity: isLoading ? 0.6 : 1,
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = "#f97316";
                          e.currentTarget.style.color = "#fff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff7ed";
                        e.currentTarget.style.color = "#f97316";
                      }}
                    >
                      {isLoading ? "Removing..." : "★ Unfeature"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
            Page {currentPage} of {totalPages} · {totalCount} featured posts
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {currentPage > 2 && (
              <button onClick={() => goToPage(1)}
                style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>«</button>
            )}
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#f97316"; }}
              onMouseLeave={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              ← Prev
            </button>
            {paginationPages.map((pg, i) =>
              pg === "..." ? (
                <span key={"e" + i} style={{ padding: "8px 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
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
              Next →
            </button>
            {currentPage < totalPages - 1 && (
              <button onClick={() => goToPage(totalPages)}
                style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>»</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}