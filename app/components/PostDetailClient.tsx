"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  toggleLikeAction,
  addCommentAction,
  deleteCommentAction,
  removeLikeAction,
} from "@/app/lib/actions/engagement";
import RichContentDisplay from "@/app/components/RichContentDisplay";

interface CommentData {
  _id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface PostData {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: string[];
  comments: CommentData[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

export default function PostDetailClient({
  post, currentUsername, backUrl,
  commentTotal, commentTotalPages, commentCurrentPage,
}: {
  post: PostData; currentUsername: string | null; backUrl: string;
  commentTotal: number; commentTotalPages: number; commentCurrentPage: number;
}) {
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showLikesList, setShowLikesList] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => { setComments(post.comments); }, [post.comments, commentCurrentPage]);

  const initials = post.author?.[0]?.toUpperCase() ?? "?";
  const isOwner = currentUsername === post.author;
  const hasLiked = currentUsername ? likes.includes(currentUsername) : false;
  const paginationPages = getPaginationPages(commentCurrentPage, commentTotalPages);

  function goToCommentPage(targetPage: number) {
    if (targetPage < 1 || targetPage > commentTotalPages || targetPage === commentCurrentPage) return;
    const from = searchParams.get("from");
    let url = `/posts/${post._id}?page=${targetPage}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    router.push(url);
    setTimeout(() => { document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" }); }, 80);
  }

  function handleToggleLike() {
    if (!currentUsername) { router.push("/login"); return; }
    if (hasLiked) { setLikes((prev) => prev.filter((u) => u !== currentUsername)); }
    else { setLikes((prev) => [...prev, currentUsername]); }
    startTransition(async () => { await toggleLikeAction(post._id); });
  }

  function handleRemoveLike(username: string) {
    setLikes((prev) => prev.filter((u) => u !== username));
    startTransition(async () => { await removeLikeAction(post._id, username); });
  }

  function handleAddComment() {
    if (!currentUsername) { router.push("/login"); return; }
    const text = commentText.trim();
    if (!text) return;
    const tempComment: CommentData = { _id: "temp-" + Date.now(), author: currentUsername, text, createdAt: new Date().toISOString() };
    setComments((prev) => [...prev, tempComment]);
    setCommentText("");
    startTransition(async () => {
      const formData = new FormData();
      formData.append("text", text);
      await addCommentAction(post._id, formData);
      router.refresh();
    });
  }

  function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    startTransition(async () => { await deleteCommentAction(post._id, commentId); });
  }

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <a href={backUrl} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>Back</a>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0 8px" }}>
        <a href={"/profile/" + post.author + "?from=/posts/" + post._id} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{post.author}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(post.createdAt)}</div>
          </div>
        </a>
        {isOwner && (
          <a href={"/posts/" + post._id + "/edit?from=/posts/" + post._id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 7, border: "1.5px solid #f97316", color: "#f97316", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Edit</a>
        )}
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#111", margin: "20px 0 24px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>{post.title}</h1>

      {/* Content */}
      <RichContentDisplay html={post.content} />

      {/* Like bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
        <button onClick={handleToggleLike} disabled={isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 50, border: hasLiked ? "1.5px solid #f97316" : "1.5px solid #e5e7eb", background: hasLiked ? "#fff7ed" : "#fff", color: hasLiked ? "#f97316" : "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {hasLiked ? "❤️" : "🤍"} {likes.length} {likes.length === 1 ? "Like" : "Likes"}
        </button>
        <button onClick={() => setShowLikesList((v) => !v)} style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: likes.length ? "pointer" : "default", fontFamily: "inherit", textDecoration: likes.length ? "underline" : "none" }}>
          {showLikesList ? "Hide likes" : likes.length ? "View likes" : ""}
        </button>
        <span style={{ fontSize: 14, color: "#9ca3af" }}>💬 {commentTotal} {commentTotal === 1 ? "Comment" : "Comments"}</span>
      </div>

      {/* Likes list */}
      {showLikesList && likes.length > 0 && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f0f0f0" }}>
          {likes.map((username) => (
            <div key={username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <a href={"/profile/" + username + "?from=/posts/" + post._id} style={{ color: "#374151", textDecoration: "none", fontWeight: 600 }}>{username}</a>
              {isOwner && (<button onClick={() => handleRemoveLike(username)} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>)}
            </div>
          ))}
        </div>
      )}

      {/* Comments section */}
      <div id="comments-section" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Comments</h2>

        {currentUsername ? (
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{currentUsername[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={2}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
              <div style={{ marginTop: 8, textAlign: "right" }}>
                <button onClick={handleAddComment} disabled={!commentText.trim() || isPending}
                  style={{ padding: "8px 20px", background: commentText.trim() ? "#f97316" : "#e5e7eb", color: commentText.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: commentText.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 18px", background: "#f9fafb", borderRadius: 10, fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
            <a href="/login" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>Log in</a> to like or comment on this post.
          </div>
        )}

        {comments.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>No comments yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {comments.map((comment) => {
              const canDelete = currentUsername === comment.author || isOwner;
              const commentInitials = comment.author[0]?.toUpperCase() ?? "?";
              return (
                <div key={comment._id} style={{ display: "flex", gap: 10 }}>
                  <a href={"/profile/" + comment.author + "?from=/posts/" + post._id} style={{ flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{commentInitials}</div>
                  </a>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <a href={"/profile/" + comment.author + "?from=/posts/" + post._id} style={{ fontSize: 13, fontWeight: 700, color: "#111", textDecoration: "none" }}>
                          {comment.author}
                          {comment.author === post.author && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: "#f97316", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 50, padding: "1px 8px", fontWeight: 700 }}>Author</span>
                          )}
                        </a>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatShortDate(comment.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.6 }}>{comment.text}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteComment(comment._id)} style={{ marginTop: 4, fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                        {currentUsername === comment.author ? "Delete" : "Remove (as author)"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {commentTotalPages > 1 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
              Page {commentCurrentPage} of {commentTotalPages} · {commentTotal} comments
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {commentCurrentPage > 2 && (
                <button onClick={() => goToCommentPage(1)} style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>«</button>
              )}
              <button onClick={() => goToCommentPage(commentCurrentPage - 1)} disabled={commentCurrentPage === 1}
                style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: commentCurrentPage === 1 ? "#f9fafb" : "#fff", color: commentCurrentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: commentCurrentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (commentCurrentPage !== 1) e.currentTarget.style.borderColor = "#f97316"; }}
                onMouseLeave={(e) => { if (commentCurrentPage !== 1) e.currentTarget.style.borderColor = "#e5e7eb"; }}>← Prev</button>
              {paginationPages.map((pg, i) =>
                pg === "..." ? (
                  <span key={"ellipsis-" + i} style={{ padding: "8px 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
                ) : (
                  <button key={"page-" + pg} onClick={() => goToCommentPage(pg as number)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: pg === commentCurrentPage ? "none" : "1.5px solid #e5e7eb", background: pg === commentCurrentPage ? "#f97316" : "#fff", color: pg === commentCurrentPage ? "#fff" : "#374151", fontSize: 13, fontWeight: pg === commentCurrentPage ? 700 : 500, cursor: pg === commentCurrentPage ? "default" : "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { if (pg !== commentCurrentPage) e.currentTarget.style.borderColor = "#f97316"; }}
                    onMouseLeave={(e) => { if (pg !== commentCurrentPage) e.currentTarget.style.borderColor = "#e5e7eb"; }}>{pg}</button>
                )
              )}
              <button onClick={() => goToCommentPage(commentCurrentPage + 1)} disabled={commentCurrentPage === commentTotalPages}
                style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: commentCurrentPage === commentTotalPages ? "#f9fafb" : "#fff", color: commentCurrentPage === commentTotalPages ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: commentCurrentPage === commentTotalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (commentCurrentPage !== commentTotalPages) e.currentTarget.style.borderColor = "#f97316"; }}
                onMouseLeave={(e) => { if (commentCurrentPage !== commentTotalPages) e.currentTarget.style.borderColor = "#e5e7eb"; }}>Next →</button>
              {commentCurrentPage < commentTotalPages - 1 && (
                <button onClick={() => goToCommentPage(commentTotalPages)} style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>»</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 40, paddingTop: 20 }}>
        <a href={backUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#374151", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to posts</a>
      </div>
    </main>
  );
}