"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { deletePostAction } from "@/app/lib/actions/post";

interface PostData {
  _id: string; title: string; content: string;
  createdAt: string; likesCount: number; commentsCount: number;
}
interface ProfileData {
  username: string; bio: string; location: string;
  avatarColor: string; joinedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
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

export default function UserProfileClient({
  profile, posts, isOwner, backUrl,
  currentPage, totalPages, totalCount,
}: {
  profile: ProfileData; posts: PostData[]; isOwner: boolean; backUrl: string;
  currentPage: number; totalPages: number; totalCount: number;
}) {
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const initials = profile.username?.[0]?.toUpperCase() ?? "?";

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deletePostAction(deleteTarget._id);
        router.refresh();
        setDeleteTarget(null);
      } catch (error) { console.error("Delete failed:", error); }
    });
  }

  function goToPost(id: string) { router.push("/posts/" + id + "?from=" + pathname); }

  function goToPage(p: number) {
    const base = `/profile/${profile.username}`;
    const fromParam = backUrl !== "/" ? `&from=${encodeURIComponent(backUrl)}` : "";
    router.push(
      p === 1
        ? base + (fromParam ? `?from=${encodeURIComponent(backUrl)}` : "")
        : `${base}?page=${p}${fromParam}`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
        <a href={backUrl} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
          ← Back
        </a>

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, margin: "24px 0 32px", flexWrap: "wrap" }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", background: profile.avatarColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 36, fontWeight: 800, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>{profile.username}</h1>
              {isOwner && (
                <a href={"/profile/edit?from=/profile/" + profile.username}
                  style={{ padding: "6px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#374151", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  Edit Profile
                </a>
              )}
            </div>
            <div style={{ display: "flex", gap: 24, marginBottom: 10, fontSize: 14, color: "#374151" }}>
              <span><strong>{totalCount}</strong> post{totalCount !== 1 ? "s" : ""}</span>
            </div>
            {profile.bio && (
              <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {profile.bio}
              </p>
            )}
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
              {profile.location && <span>📍 {profile.location}</span>}
              <span>🗓 Joined {formatDate(profile.joinedAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 24 }} />

        {/* Posts list */}
        {totalCount === 0 ? (
          <div style={{ textAlign: "center", padding: 60, border: "1px solid #eee", borderRadius: 12, color: "#9ca3af", fontSize: 14 }}>
            No posts yet.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map((post) => {
                const plainContent = stripHtml(post.content);
                return (
                  <div key={post._id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div onClick={() => goToPost(post._id)} style={{ cursor: "pointer", flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#999" }}>{formatDate(post.createdAt)}</div>
                        <h3 style={{ margin: "6px 0 4px", fontSize: 16, fontWeight: 700 }}>{post.title}</h3>
                        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
                          {plainContent.slice(0, 140)}{plainContent.length > 140 ? "…" : ""}{" "}
                          <span style={{ color: "#f97316", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>Read more →</span>
                        </p>
                      </div>
                      {isOwner && (
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center", paddingTop: 4 }}>
                          <a
                            href={`/posts/${post._id}/edit?from=/profile/${profile.username}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "transparent", color: "#f97316", border: "1.5px solid #f97316", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                            Edit
                          </a>
                          <button onClick={() => setDeleteTarget(post)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "transparent", color: "#ef4444", border: "1.5px solid #fca5a5", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 18, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f5f5f5" }}>
                      <a href={"/posts/" + post._id + "?from=" + pathname}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                        ❤️ {post.likesCount}
                      </a>
                      <a href={"/posts/" + post._id + "?from=" + pathname}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                        💬 {post.commentsCount}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ marginTop: 28 }}>
                <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
                  Page {currentPage} of {totalPages} · {totalCount} posts
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>

                  {/* First « */}
                  {currentPage > 2 && (
                    <button onClick={() => goToPage(1)}
                      style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>«</button>
                  )}

                  {/* Prev */}
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#f97316"; }}
                    onMouseLeave={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                    ← Prev
                  </button>

                  {/* Page numbers */}
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

                  {/* Next */}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                    style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === totalPages ? "#f9fafb" : "#fff", color: currentPage === totalPages ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = "#f97316"; }}
                    onMouseLeave={(e) => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                    Next →
                  </button>

                  {/* Last » */}
                  {currentPage < totalPages - 1 && (
                    <button onClick={() => goToPage(totalPages)}
                      style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>»</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete modal */}
      {deleteTarget !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 12, width: 320 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>Delete this post?</h3>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 20px" }}>{deleteTarget.title}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDelete} disabled={isPending}
                style={{ flex: 1, background: "#ef4444", color: "#fff", padding: "10px 0", borderRadius: 8, fontWeight: 700, border: "none", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1, fontFamily: "inherit" }}>
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={isPending}
                style={{ flex: 1, background: "#f3f4f6", color: "#374151", padding: "10px 0", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}