"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminUpdateCommentAction,
  adminDeleteCommentAction,
  adminClearAllCommentsAction,
} from "@/app/lib/actions/admin";

interface CommentData {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminCommentsClient({
  postId,
  postTitle,
  postAuthor,
  comments: initialComments,
}: {
  postId: string;
  postTitle: string;
  postAuthor: string;
  comments: CommentData[];
}) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [editTarget, setEditTarget] = useState<CommentData | null>(null);
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CommentData | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function openEdit(comment: CommentData) {
    setEditTarget(comment);
    setEditText(comment.text);
    setEditError("");
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    if (!editText.trim()) { setEditError("Comment cannot be empty."); return; }
    startTransition(async () => {
      const result = await adminUpdateCommentAction(postId, editTarget.id, editText);
      if (result?.error) { setEditError(result.error); return; }
      setComments((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, text: editText.trim() } : c))
      );
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await adminDeleteCommentAction(postId, deleteTarget.id);
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    });
  }

  function handleClearAll() {
    startTransition(async () => {
      await adminClearAllCommentsAction(postId);
      setComments([]);
      setShowClearAll(false);
      router.refresh();
    });
  }

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/posts" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
          ← Back to Posts
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Comments</h1>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              On &quot;{postTitle}&quot; by {postAuthor} · {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </p>
          </div>
          {comments.length > 0 && (
            <button
              onClick={() => setShowClearAll(true)}
              style={{
                padding: "9px 18px", background: "#fff", border: "1px solid #fca5a5",
                borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Clear All Comments
            </button>
          )}
        </div>
      </div>

      {comments.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          No comments on this post.
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              style={{
                padding: "18px 20px",
                borderBottom: i < comments.length - 1 ? "1px solid #f5f5f5" : "none",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#f97316",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                  }}>
                    {comment.author[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{comment.author}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(comment.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{comment.text}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(comment)}
                  style={{ padding: "5px 12px", border: "1px solid #f97316", borderRadius: 6, background: "#fff", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(comment)}
                  style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit comment modal */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 440 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Edit Comment</h3>
            {editError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              style={{ ...input, resize: "vertical", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSaveEdit} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditTarget(null)}
                style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete single comment modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 360 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Delete comment?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
              This comment by <strong>{deleteTarget.author}</strong> will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDelete} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirmation modal */}
      {showClearAll && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 380 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Clear all comments?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
              This will permanently delete all {comments.length} comments on this post. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleClearAll} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Clearing..." : "Clear All"}
              </button>
              <button onClick={() => setShowClearAll(false)}
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