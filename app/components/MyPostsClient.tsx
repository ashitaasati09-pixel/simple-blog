"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deletePostAction } from "@/app/lib/actions/post";

interface PostData {
  _id: string;
  title: string;
  content: string;
  createdAt?: string; // ✅ made optional (fix error)
}

function formatDate(iso?: string) {
  if (!iso) return "No date"; // ✅ prevent crash
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyPostsClient({
  posts = [], // ✅ fallback
  username,
}: {
  posts: PostData[];
  username: string;
}) {
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        await deletePostAction(deleteTarget._id);
        router.refresh();
        setDeleteTarget(null);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    });
  }

  return (
    <>
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        {/* ✅ FIXED Link */}
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "#6b7280",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Back
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "20px 0 32px",
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>
              My Posts
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {posts.length} post{posts.length !== 1 ? "s" : ""} by {username}
            </p>
          </div>

          {/* ✅ FIXED Link */}
          <Link
            href="/create?from=/my-posts"
            style={{
              padding: "10px 18px",
              background: "#f97316",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              border: "1px solid #eee",
              borderRadius: 12,
            }}
          >
            <h3>No posts yet</h3>

            {/* ✅ FIXED Link */}
            <Link href="/create?from=/my-posts" style={{ color: "#f97316" }}>
              Create your first post
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.map((post) => {
              if (!post) return null; // ✅ safety

              return (
                <div
                  key={post._id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {formatDate(post.createdAt)}
                    </div>

                    <h3
                      style={{
                        margin: "6px 0 4px",
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      {post.title}
                    </h3>

                    <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
                      {post.content?.slice(0, 100)}...
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {/* ✅ FIXED Link */}
                    <Link
                      href={`/posts/${post._id}/edit?from=/my-posts`}
                      style={{
                        padding: "6px 14px",
                        color: "#2563eb",
                        border: "1px solid #2563eb",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      ✏️ Edit
                    </Link>

                    <button
                      onClick={() => setDeleteTarget(post)}
                      style={{
                        padding: "6px 14px",
                        color: "#ef4444",
                        border: "1px solid #ef4444",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "transparent",
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ✅ Delete Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 30,
              borderRadius: 12,
              width: 320,
            }}
          >
            <h3>Delete this post?</h3>
            <p>{deleteTarget.title}</p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDelete} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </button>

              <button onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}