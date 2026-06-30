"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePostAction } from "@/app/lib/actions/post";
import RichTextEditor from "@/app/components/RichTextEditor";

export default function EditPostForm({
  postId,
  initialTitle,
  initialContent,
  backUrl,
}: {
  postId: string;
  initialTitle: string;
  initialContent: string;
  backUrl: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error");
  const displayError = error || (urlError === "fields" ? "Title and content are required." : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required."); return; }
    if (!content.trim() || content === "<p></p>") { setError("Content is required."); return; }

    setLoading(true);
    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("redirectTo", backUrl); // NEW — tells the action where "back" actually is

    await updatePostAction(formData);
    setLoading(false);
  }

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "14px 16px", border: "1px solid #e5e7eb",
    borderRadius: 10, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 20px" }}>Edit post</h1>

      {displayError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <RichTextEditor content={content} onChange={setContent} placeholder="Edit your story..." />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 28px", background: loading ? "#fdba74" : "#f97316",
              border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            style={{
              padding: "12px 28px", background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}