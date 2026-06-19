"use client";
import { useState } from "react";
import { updatePostAction } from "@/app/lib/actions/post";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasChanges = title !== initialTitle || content !== initialContent;

  async function handleConfirm() {
    setLoading(true);
    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("title", title);
    formData.append("content", content);
    await updatePostAction(formData);
    setLoading(false);
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 15,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "'Segoe UI', sans-serif",
  };

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...inputStyle, padding: "12px 14px" }}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            style={{ ...inputStyle, padding: "12px 14px", resize: "vertical", lineHeight: 1.7 }}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => setShowConfirm(true)}
            style={{
              padding: "13px 32px",
              background: hasChanges ? "#f97316" : "#e5e7eb",
              border: "none", borderRadius: 8,
              color: hasChanges ? "#fff" : "#9ca3af",
              fontSize: 15, fontWeight: 700,
              cursor: hasChanges ? "pointer" : "not-allowed",
              fontFamily: "'Segoe UI', sans-serif",
              boxShadow: hasChanges ? "0 2px 10px rgba(249,115,22,0.28)" : "none",
            }}
          >
            Save Changes
          </button>

          {/* ✅ Cancel also goes back to where they came from */}
          <a href={backUrl} style={{
            padding: "13px 24px",
            border: "1.5px solid #e5e7eb", borderRadius: 8,
            color: "#374151", textDecoration: "none",
            fontSize: 15, fontWeight: 600,
            display: "inline-flex", alignItems: "center",
          }}>
            Cancel
          </a>
        </div>

        {!hasChanges && (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            Make changes above to enable saving.
          </p>
        )}
      </div>

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              ✏️
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Save changes?</h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
              Are you sure you want to update this post? This will overwrite the current version.
            </p>
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 14px", marginBottom: 24, border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>New title</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleConfirm} disabled={loading} style={{
                flex: 1, padding: "12px",
                background: loading ? "#fdba74" : "#f97316",
                border: "none", borderRadius: 8, color: "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Segoe UI', sans-serif",
              }}>
                {loading ? "Saving…" : "Yes, save it"}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={loading} style={{
                flex: 1, padding: "12px", background: "#fff",
                border: "1.5px solid #e5e7eb", borderRadius: 8,
                color: "#374151", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Segoe UI', sans-serif",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}