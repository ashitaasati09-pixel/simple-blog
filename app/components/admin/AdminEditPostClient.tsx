"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdatePostAction } from "@/app/lib/actions/admin";

export default function AdminEditPostClient({
  postId,
  title,
  content,
  author,
}: {
  postId: string;
  title: string;
  content: string;
  author: string;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "12px 14px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit",
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminUpdatePostAction(postId, formData);
      if (result?.error) { setError(result.error); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div style={{ padding: "32px", maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/posts" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
          ← Back to Posts
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "8px 0 4px" }}>Edit Post</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>by {author}</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "28px" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
            Post updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Title
            </label>
            <input name="title" defaultValue={title} required style={input} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Content
            </label>
            <textarea
              name="content"
              defaultValue={content}
              required
              rows={12}
              style={{ ...input, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "11px 24px", background: "#f97316", border: "none",
                borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <a
              href="/admin/posts"
              style={{
                padding: "11px 24px", background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 8, color: "#374151", fontSize: 13, fontWeight: 600,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}