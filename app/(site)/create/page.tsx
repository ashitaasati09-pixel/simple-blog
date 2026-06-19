import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { createPostAction } from "@/app/lib/actions/post";

export default async function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { from } = await searchParams;
  const backUrl = from ?? "/";

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "50px 20px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div style={{ marginBottom: 30 }}>
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

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            margin: "18px 0 10px",
            color: "#111",
          }}
        >
          Create New Post
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {user.username?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 14, color: "#6b7280" }}>
            Publishing as{" "}
            <strong style={{ color: "#111" }}>{user.username}</strong>
          </span>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          padding: "36px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
        }}
      >
        <form
          action={createPostAction}
          style={{ display: "flex", flexDirection: "column", gap: 22 }}
        >
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
                display: "block",
              }}
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter your post title..."
              required
              style={{
                width: "100%",
                padding: "14px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
                display: "block",
              }}
            >
              Content
            </label>
            <textarea
              name="content"
              placeholder="Write your story..."
              required
              rows={10}
              style={{
                width: "100%",
                padding: "14px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              style={{
                padding: "14px 32px",
                background: "#f97316",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
                fontFamily: "inherit",
              }}
            >
              Publish
            </button>

            <a
              href={backUrl}
              style={{
                padding: "14px 24px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 10,
                color: "#374151",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}