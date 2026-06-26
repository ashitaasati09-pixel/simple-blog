import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import CreatePostForm from "@/app/components/CreatePostForm";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const backUrl = from || "/";

  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) redirect("/login");

  await connectDB();
  const user = await User.findById(userId).select("username avatarColor").lean() as
    | { username: string; avatarColor?: string }
    | null;

  if (!user) redirect("/login");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
      <a href={backUrl} style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
        ← Back
      </a>

      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: "12px 0 14px" }}>
        Create New Post
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: user.avatarColor || "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 13, fontWeight: 700,
          }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <span style={{ fontSize: 14, color: "#6b7280" }}>
          Publishing as <strong style={{ color: "#111" }}>{user.username}</strong>
        </span>
      </div>

      <CreatePostForm backUrl={backUrl} />
    </div>
  );
}