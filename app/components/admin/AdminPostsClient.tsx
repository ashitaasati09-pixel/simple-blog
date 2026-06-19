"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeletePostAction, adminUpdatePostAction } from "@/app/lib/actions/admin";

interface PostData {
  id: string; title: string; content: string; author: string;
  likesCount: number; commentsCount: number; ip: string; createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPostsClient({ posts: initialPosts }: { posts: PostData[] }) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [editTarget, setEditTarget] = useState<PostData | null>(null);
  const [editError, setEditError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminUpdatePostAction(editTarget.id, formData);
      if (result?.error) { setEditError(result.error); return; }

      const newTitle = (formData.get("title") as string)?.trim();
      const newContent = (formData.get("content") as string)?.trim();
      setPosts((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...p, title: newTitle, content: newContent } : p))
      );
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

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Posts</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{posts.length} total posts</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Title", "Author", "❤️ Likes", "💬 Comments", "IP", "Date", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ padding: "12px 16px" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                    style={{
                      background: "none", border: "none", padding: 0,
                      fontWeight: 700, color: "#111", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 13, textAlign: "left",
                    }}
                  >
                    {post.title.length > 40 ? post.title.slice(0, 40) + "..." : post.title}
                  </button>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {post.content.slice(0, 60)}...
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ color: "#f97316", fontWeight: 600 }}>{post.author}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>{post.likesCount}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                    style={{ background: "none", border: "none", padding: 0, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
                  >
                    {post.commentsCount}
                  </button>
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>{post.ip}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{formatDate(post.createdAt)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => { setEditError(""); setEditTarget(post); }}
                      style={{ padding: "4px 10px", border: "1px solid #f97316", borderRadius: 6, background: "#fff", color: "#f97316", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/admin/posts/" + post.id + "/comments")}
                      style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Comments
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(post)}
                      style={{ padding: "4px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal — same pattern as Users/Admins */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: "40px 16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 520 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Edit Post</h3>
            {editError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Title</label>
                <input name="title" defaultValue={editTarget.title} required style={input} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Content</label>
                <textarea name="content" defaultValue={editTarget.content} required rows={8} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={isPending}
                  style={{ flex: 1, padding: "10px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 360 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Delete post?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
              Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleDelete(deleteTarget)} disabled={isPending}
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
    </div>
  );
}