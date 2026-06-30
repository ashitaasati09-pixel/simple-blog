"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminDeletePostAction, adminUpdatePostAction } from "@/app/lib/actions/admin";
import { toggleFeaturedAction } from "@/app/lib/actions/admin-featured";
import RichTextEditor from "@/app/components/RichTextEditor";
import { stripHtml } from "@/app/lib/strip-html";

interface PostData {
  id: string; title: string; content: string; author: string;
  likesCount: number; commentsCount: number; ip: string; createdAt: string;
  featured: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export default function AdminPostsClient({
  posts: initialPosts, totalCount, currentPage, totalPages,
}: {
  posts: PostData[]; totalCount: number; currentPage: number; totalPages: number;
}) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [editTarget, setEditTarget] = useState<PostData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { setPosts(initialPosts); }, [initialPosts]);

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  function openEdit(post: PostData) {
    setEditError(""); setEditTarget(post); setEditTitle(post.title); setEditContent(post.content);
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    if (!editTitle.trim()) { setEditError("Title is required."); return; }
    if (!editContent.trim() || editContent === "<p></p>") { setEditError("Content is required."); return; }
    const formData = new FormData();
    formData.append("title", editTitle); formData.append("content", editContent);
    startTransition(async () => {
      const result = await adminUpdatePostAction(editTarget.id, formData);
      if (result?.error) { setEditError(result.error); return; }
      setPosts((prev) => prev.map((p) => p.id === editTarget.id
        ? { ...p, title: editTitle, content: editContent } : p));
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleDelete(post: PostData) {
    startTransition(async () => {
      await adminDeletePostAction(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setDeleteTarget(null);
      router.refresh();
    });
  }

  async function handleToggleFeatured(post: PostData) {
    if (loadingId) return;
    setLoadingId(post.id);
    setFeaturedError(null);

    // Optimistic update
    const newFeatured = !post.featured;
    setPosts((prev) =>
      prev.map((p) => p.id === post.id ? { ...p, featured: newFeatured } : p)
    );

    try {
      const result = await toggleFeaturedAction(post.id, newFeatured);
      if (result?.error) {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) => p.id === post.id ? { ...p, featured: post.featured } : p)
        );
        setFeaturedError(result.error);
      } else {
        // Sync with server's actual value if returned
        if (typeof result?.featured === "boolean") {
          setPosts((prev) =>
            prev.map((p) => p.id === post.id ? { ...p, featured: result.featured! } : p)
          );
        }
        router.refresh();
      }
    } catch (err) {
      // Revert on exception
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, featured: post.featured } : p)
      );
      setFeaturedError("Failed to update featured status. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    router.push(p === 1 ? "/admin/posts" : `/admin/posts?page=${p}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Posts</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{totalCount} total posts</p>
      </div>

      {/* Featured error toast */}
      {featuredError && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          {featuredError}
          <button onClick={() => setFeaturedError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Title", "Author", "❤️", "💬", "IP", "Date", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  No posts yet.
                </td>
              </tr>
            ) : posts.map((post) => {
              const isLoading = loadingId === post.id;
              return (
                <tr key={post.id} style={{ borderBottom: "1px solid #f5f5f5" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {post.featured && (
                        <span style={{ fontSize: 12, color: "#f97316" }} title="Featured">⭐</span>
                      )}
                      <button type="button"
                        onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                        style={{ background: "none", border: "none", padding: 0, fontWeight: 700, color: "#111", cursor: "pointer", fontFamily: "inherit", fontSize: 13, textAlign: "left" }}>
                        {post.title.length > 38 ? post.title.slice(0, 38) + "..." : post.title}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {stripHtml(post.content).slice(0, 55)}...
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: "#f97316", fontWeight: 600 }}>{post.author}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>{post.likesCount}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button type="button"
                      onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                      style={{ background: "none", border: "none", padding: 0, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                      {post.commentsCount}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>{post.ip}</td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{formatDate(post.createdAt)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => openEdit(post)}
                        style={{ padding: "4px 10px", border: "1px solid #f97316", borderRadius: 6, background: "#fff", color: "#f97316", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Edit
                      </button>

                      <button type="button"
                        onClick={() => handleToggleFeatured(post)}
                        disabled={isLoading}
                        style={{
                          padding: "4px 10px",
                          border: post.featured ? "1px solid #f97316" : "1px solid #e5e7eb",
                          borderRadius: 6,
                          background: post.featured ? "#fff7ed" : "#fff",
                          color: post.featured ? "#f97316" : "#6b7280",
                          fontSize: 11, fontWeight: 600,
                          cursor: isLoading ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          opacity: isLoading ? 0.6 : 1,
                          minWidth: 90,
                          transition: "all 0.15s ease",
                        }}>
                        {isLoading ? "..." : post.featured ? "★ Unfeature" : "☆ Feature"}
                      </button>

                      <button type="button"
                        onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                        style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Comments
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(post)}
                        style={{ padding: "4px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Delete
                      </button>
                    </div>
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
            Page {currentPage} of {totalPages} · {totalCount} posts
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

      {/* Edit modal */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: "40px 16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 680, maxWidth: "92vw" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Edit Post</h3>
            {editError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={input} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Content</label>
                <RichTextEditor content={editContent} onChange={setEditContent} placeholder="Edit post content..." />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={isPending}
                  style={{ flex: 1, padding: "10px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => { setEditTarget(null); setEditError(""); }}
                  style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 360 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Delete post?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
              Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleDelete(deleteTarget)} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? 0.7 : 1 }}>
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}