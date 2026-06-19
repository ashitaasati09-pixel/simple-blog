/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { deletePostAction } from "@/app/lib/actions/post";

interface PostData {
  _id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const WORD_LIMIT = 40;

function getSnippet(content: string) {
  const words = content.trim().split(/\s+/);
  if (words.length <= WORD_LIMIT) return content;
  return words.slice(0, WORD_LIMIT).join(" ") + "…";
}

export default function HomePostsClient({
  posts,
  currentUsername,
}: {
  posts: PostData[];
  currentUsername: string | null;
}) {
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function handleDelete() {
    if (!deleteTarget?._id) return;
    startTransition(async () => {
      try {
        await deletePostAction(deleteTarget._id);
        router.refresh();
        setDeleteTarget(null);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });
  }

  function goToPost(id: string) {
    router.push("/posts/" + id + "?from=" + pathname);
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map((post) => {
          const isOwner = currentUsername && currentUsername === post.author;
          const initials = post.author?.[0]?.toUpperCase() ?? "?";
          const snippet = getSnippet(post.content);

          return (
            <article
              key={post._id}
              style={{
                background: "#fff",
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                padding: "22px 24px",
              }}
            >
              {/* Author row — not part of click-to-open */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <a
                  href={"/profile/" + post.author + "?from=" + pathname}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#f97316",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {post.author}
                  </span>
                  <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {formatDate(post.createdAt)}
                  </span>
                </a>

                {isOwner && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={"/posts/" + post._id + "/edit?from=" + pathname}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1.5px solid #f97316",
                        color: "#f97316",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ✏️ Edit
                    </a>
                    <button
                      onClick={() => setDeleteTarget(post)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1.5px solid #fca5a5",
                        background: "transparent",
                        color: "#ef4444",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Segoe UI', sans-serif",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Clickable area: title + content + read more */}
              <div
                onClick={() => goToPost(post._id)}
                style={{ cursor: "pointer" }}
              >
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#111",
                    lineHeight: 1.3,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {post.title}
                </h2>

                <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
                  {snippet}{" "}
                  <span
                    style={{
                      color: "#f97316",
                      fontWeight: 700,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Read more →
                  </span>
                </p>
              </div>

              {/* Like / comment counts — not part of click area, link to post anyway */}
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #f5f5f5",
                }}
              >
                <a
                  href={"/posts/" + post._id + "?from=" + pathname}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    color: "#6b7280",
                    textDecoration: "none",
                  }}
                >
                  ❤️ {post.likesCount}
                </a>
                <a
                  href={"/posts/" + post._id + "?from=" + pathname}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    color: "#6b7280",
                    textDecoration: "none",
                  }}
                >
                  💬 {post.commentsCount}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "36px 32px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 16,
              }}
            >
              🗑️
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
              Delete this post?
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 }}>
              This action cannot be undone.
            </p>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 24,
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 600,
                  marginBottom: 3,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Post
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                {deleteTarget.title}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: isPending ? "#fca5a5" : "#dc2626",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isPending ? "not-allowed" : "pointer",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                {isPending ? "Deleting…" : "Yes, delete it"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  color: "#374151",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}