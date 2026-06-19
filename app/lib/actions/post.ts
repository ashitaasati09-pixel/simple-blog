"use server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { connectDB } from "@/app/lib/mongodb";
import Post from "@/app/models/post";
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
  redirect("/dashboard");
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = formData.get("postId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title?.trim() || !content?.trim()) redirect(`/posts/${postId}/edit?error=fields`);

  await connectDB();
  const post = await Post.findById(postId).lean() as { author: string } | null;

  // Author or admin can update
  if (!post || (post.author !== user.username && !user.isAdmin)) redirect("/dashboard");

  await Post.findByIdAndUpdate(postId, { title, content });
  redirect("/my-posts");
}

export async function deletePostAction(postId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  const post = await Post.findById(postId).lean() as { author: string } | null;

  // Author or admin can delete
  if (!post || (post.author !== user.username && !user.isAdmin)) redirect("/dashboard");

  await Post.findByIdAndDelete(postId);
  redirect("/my-posts");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session_user", "", { expires: new Date(0), path: "/" });
  redirect("/");
}