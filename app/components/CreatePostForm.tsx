"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPostAction } from "@/app/lib/actions/post";
import RichTextEditor from "@/app/components/RichTextEditor";

export default function CreatePostForm({ backUrl }: { backUrl: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    formData.append("title", title);
    formData.append("content", content);

    await createPostAction(formData);
    setLoading(false);
  }

  const titleInput = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "14px 16px", border: "1px solid #e5e7eb",
    borderRadius: 10, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit",
  };

  return (
    <div>
      {displayError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Title</label>
        </div>
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Enter your post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={titleInput}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Content</label>
        </div>
        <div style={{ marginBottom: 24 }}>
          <RichTextEditor content={content} onChange={setContent} placeholder="Write your story..." />
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
            {loading ? "Publishing..." : "Publish"}
          </button>
          <a
            href={backUrl}
            style={{
              padding: "12px 28px", background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}