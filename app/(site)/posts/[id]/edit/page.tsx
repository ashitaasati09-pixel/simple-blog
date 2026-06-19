import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
import EditPostForm from "@/app/components/EditPostForm";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  await connectDB();
  const raw = await Post.findById(id).lean();
  if (!raw) notFound();

  const post = raw as {
    _id: { toString: () => string };
    title: string;
    content: string;
    author: string;
  };

  if (post.author !== user.username) redirect("/");

  // ✅ wherever they came from, go back there. Default to /
  const backUrl = from ?? "/";

  const mainStyle = { maxWidth: 680, margin: "0 auto", padding: "40px 20px" };
  const backStyle = { fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 } as const;
  const headerStyle = { margin: "16px 0 32px" };
  const h1Style = { fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 6px", letterSpacing: "-0.5px" } as const;
  const subtitleStyle = { fontSize: 13, color: "#9ca3af", margin: 0 } as const;

  return (
    <main style={mainStyle}>
      <a href={backUrl} style={backStyle}>
        ← Back
      </a>
      <div style={headerStyle}>
        <h1 style={h1Style}>Edit Post</h1>
        <p style={subtitleStyle}>
          Make your changes — you&apos;ll confirm before saving.
        </p>
      </div>
      <EditPostForm
        postId={post._id.toString()}
        initialTitle={post.title}
        initialContent={post.content}
        backUrl={backUrl}
      />
    </main>
  );
}