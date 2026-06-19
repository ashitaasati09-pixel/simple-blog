"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { deletePostAction } from "@/app/lib/actions/post";

interface PostData {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface ProfileData {
  username: string;
  bio: string;
  location: string;
  avatarColor: string;
  joinedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserProfileClient({
  profile,
  posts,
  isOwner,
  backUrl,
}: {
  profile: ProfileData;
  posts: PostData[];
  isOwner: boolean;
  backUrl: string;
}) {
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const initials = profile.username?.[0]?.toUpperCase() ?? "?";

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

  function goToPost(id: string) {
    router.push("/posts/" + id + "?from=" + pathname);
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

        {/* ---- Profile header ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            margin: "24px 0 32px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: profile.avatarColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 36,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111",
                  margin: 0,
                }}
              >
                {profile.username}
              </h1>

              {isOwner && (
                <a
                  href={"/profile/edit?from=/profile/" + profile.username}
                  style={{
                    padding: "6px 16px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    color: "#374151",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Edit Profile
                </a>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 10,
                fontSize: 14,
                color: "#374151",
              }}
            >
              <span>
                <strong>{posts.length}</strong> post
                {posts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {profile.bio && (
              <p
                style={{
                  fontSize: 14,
                  color: "#374151",
                  margin: "0 0 6px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {profile.bio}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "#9ca3af",
                flexWrap: "wrap",
              }}
            >
              {profile.location && <span>📍 {profile.location}</span>}
              <span>🗓 Joined {formatDate(profile.joinedAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f0f0f0", margin: "0 0 24px" }} />

        {/* ---- Posts ---- */}
        <h2
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#111",
            margin: "0 0 16px",
          }}
        >
          Posts
        </h2>

        {posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              border: "1px solid #eee",
              borderRadius: 12,
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            No posts yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {posts.map((post) => (
              <div
                key={post._id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  {/* Clickable content area */}
                  <div
                    onClick={() => goToPost(post._id)}
                    style={{ cursor: "pointer", flex: 1 }}
                  >
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
                      {post.content.slice(0, 140)}
                      {post.content.length > 140 ? "…" : ""}{" "}
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

                  {/* Edit/Delete: only visible to owner */}
                  {isOwner && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexShrink: 0,
                        alignItems: "center",
                        paddingTop: 4,
                      }}
                    >
                      <a
                        href={
                          "/posts/" +
                          post._id +
                          "/edit?from=/profile/" +
                          profile.username
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 14px",
                          background: "transparent",
                          color: "#f97316",
                          border: "1.5px solid #f97316",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Edit
                      </a>
                      <button
                        onClick={() => setDeleteTarget(post)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 14px",
                          background: "transparent",
                          color: "#ef4444",
                          border: "1.5px solid #fca5a5",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Like / comment counts */}
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    marginTop: 12,
                    paddingTop: 10,
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
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
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
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>
              Delete this post?
            </h3>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 20px" }}>
              {deleteTarget.title}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "#fff",
                  padding: "10px 0",
                  borderRadius: 8,
                  fontWeight: 700,
                  border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                style={{
                  flex: 1,
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "10px 0",
                  borderRadius: 8,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
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