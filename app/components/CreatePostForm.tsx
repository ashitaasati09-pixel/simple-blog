"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/app/lib/actions/post";

export default function CreatePostForm({
  username,
  backUrl,
}: {
  username: string;
  backUrl: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const initials = username?.[0]?.toUpperCase() ?? "?";

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    await createPostAction(formData);
    setLoading(false);
  }

  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <a
        href={backUrl}
        style={{
          fontSize: 13,
          color: "#6b7280",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Back
      </a>

      <div style={{ margin: "24px 0 32px" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#111",
            margin: "0 0 16px",
            letterSpacing: "-0.5px",
          }}
        >
          Create New Post
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: 14, color: "#6b7280" }}>
            Publishing as{" "}
            <strong style={{ color: "#111" }}>{username}</strong>
          </span>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your post title..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 15,
              color: "#111",
              background: "#fff",
              outline: "none",
              fontFamily: "inherit",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your story..."
            rows={12}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 15,
              color: "#111",
              background: "#fff",
              outline: "none",
              fontFamily: "inherit",
              resize: "vertical",
              lineHeight: 1.7,
            }}
            onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            style={{
              padding: "13px 32px",
              background:
                loading || !title.trim() || !content.trim()
                  ? "#e5e7eb"
                  : "#f97316",
              border: "none",
              borderRadius: 8,
              color:
                loading || !title.trim() || !content.trim()
                  ? "#9ca3af"
                  : "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor:
                loading || !title.trim() || !content.trim()
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "inherit",
              boxShadow:
                loading || !title.trim() || !content.trim()
                  ? "none"
                  : "0 2px 10px rgba(249,115,22,0.28)",
            }}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>

          <a
            href={backUrl}
            style={{
              padding: "13px 24px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              color: "#374151",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Cancel
          </a>
        </div>
      </div>
    </main>
  );
}