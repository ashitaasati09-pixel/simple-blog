"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import User from "@/app/models/user";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) return null;
  await connectDB();
  return await User.findById(userId)
    .select("username isAdmin")
    .lean() as { username: string; isAdmin?: boolean } | null;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function createPostAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  if (!title?.trim() || !content?.trim()) redirect("/create?error=fields");

  const ip = await getClientIp();

  await connectDB();
  await Post.create({
    title,
    content,
    author: user.username,
    ipAddress: ip,
    likes: [],
    comments: [],
  });

  revalidatePath("/admin/posts");
  revalidatePath("/dashboard");
  revalidatePath("/my-posts");

  redirect("/dashboard");
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = formData.get("postId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Where to send the user back to after saving — falls back to /my-posts
  // if it's missing, and is restricted to internal paths only (security: avoid open redirects)
  const requestedRedirect = (formData.get("redirectTo") as string) || "/my-posts";
  const safeRedirect = requestedRedirect.startsWith("/") ? requestedRedirect : "/my-posts";

  if (!title?.trim() || !content?.trim()) {
    redirect(`/posts/${postId}/edit?error=fields&from=${encodeURIComponent(safeRedirect)}`);
  }

  await connectDB();
  const post = await Post.findById(postId).lean() as { author: string } | null;

  if (!post || (post.author !== user.username && !user.isAdmin)) redirect("/dashboard");

  await Post.findByIdAndUpdate(postId, { title, content });

  revalidatePath("/admin/posts");
  revalidatePath("/my-posts");
  revalidatePath("/dashboard");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(safeRedirect);

  redirect(safeRedirect);
}

export async function deletePostAction(postId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  const post = await Post.findById(postId).lean() as { author: string } | null;

  if (!post || (post.author !== user.username && !user.isAdmin)) redirect("/dashboard");

  await Post.findByIdAndDelete(postId);

  revalidatePath("/admin/posts");
  revalidatePath("/dashboard");
  revalidatePath("/my-posts");

  redirect("/my-posts");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session_user", "", { expires: new Date(0), path: "/" });
  redirect("/");
}

export async function getFeaturedPosts(): Promise<{
  _id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  featured: boolean;
}[]> {
  await connectDB();
  const posts = await Post.find({ featured: true })
    .sort({ createdAt: -1 })
    .lean() as any[];

  return posts.map((p) => ({
    _id: p._id.toString(),
    title: p.title ?? "",
    author: p.author ?? "",
    content: p.content ?? "",
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    likesCount: Array.isArray(p.likes) ? p.likes.length : (p.likesCount ?? 0),
    commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount ?? 0),
    featured: true,
  }));
}