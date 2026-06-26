"use server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import User from "@/app/models/user";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getClientIp } from "@/app/lib/get-ip";

// ---- USER MANAGEMENT ----

export async function adminCreateUserAction(formData: FormData) {
  await requireAdmin();
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || "";
  const location = (formData.get("location") as string)?.trim() || "";

  if (!username || !email || !password || !confirmPassword) {
    return { error: "All fields required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  await connectDB();
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return { error: "Username or email already taken." };

  const ip = await getClientIp();
  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    username, email, password: hashed, bio, location,
    ipAddress: ip, isBanned: false,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminUpdateUserAction(userId: string, formData: FormData) {
  await requireAdmin();
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() ?? "";
  const location = (formData.get("location") as string)?.trim() ?? "";

  if (!username || !email) {
    return { error: "Username and email are required." };
  }

  await connectDB();

  const existing = await User.findOne({
    _id: { $ne: userId },
    $or: [{ username }, { email }],
  });
  if (existing) return { error: "Username or email already taken by another user." };

  const updateData: { username: string; email: string; bio: string; location: string; password?: string } = {
    username, email, bio, location,
  };

  if (password) {
    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    updateData.password = await bcrypt.hash(password, 12);
  }

  await User.findByIdAndUpdate(userId, updateData);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminDeleteUserAction(userId: string) {
  await requireAdmin();
  await connectDB();
  const user = await User.findById(userId).lean() as { username: string } | null;
  if (!user) return { error: "User not found." };

  await User.findByIdAndDelete(userId);
  await Post.deleteMany({ author: user.username });

  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  return { success: true };
}

export async function adminToggleBanAction(userId: string, ban: boolean) {
  await requireAdmin();
  await connectDB();

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { isBanned: ban } },
    { new: true }
  ).lean() as { isBanned?: boolean } | null;

  if (!updated) return { error: "User not found — could not update ban status." };

  revalidatePath("/admin/users");
  return { success: true, isBanned: updated.isBanned };
}

// ---- POST MANAGEMENT ----

export async function adminGetPostAction(postId: string) {
  await requireAdmin();
  await connectDB();
  return await Post.findById(postId).lean();
}

export async function adminUpdatePostAction(postId: string, formData: FormData) {
  await requireAdmin();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title || !content) return { error: "Title and content are required." };

  await connectDB();
  await Post.findByIdAndUpdate(postId, { title, content });

  // Revalidate every place this post's title/content is shown,
  // so an admin edit shows up immediately on the public/user side too
  revalidatePath("/admin/posts");
  revalidatePath("/posts/" + postId);
  revalidatePath("/");
  revalidatePath("/my-posts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function adminDeletePostAction(postId: string) {
  await requireAdmin();
  await connectDB();
  await Post.findByIdAndDelete(postId);

  revalidatePath("/admin/posts");
  revalidatePath("/");
  revalidatePath("/my-posts");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- COMMENT MANAGEMENT ----

export async function adminGetPostWithCommentsAction(postId: string) {
  await requireAdmin();
  await connectDB();
  return await Post.findById(postId).lean();
}

export async function adminUpdateCommentAction(postId: string, commentId: string, text: string) {
  await requireAdmin();
  const trimmed = text.trim();
  if (!trimmed) return { error: "Comment text cannot be empty." };

  await connectDB();
  await Post.updateOne(
    { _id: postId, "comments._id": commentId },
    { $set: { "comments.$.text": trimmed } }
  );

  revalidatePath("/admin/posts/" + postId + "/comments");
  revalidatePath("/posts/" + postId);
  return { success: true };
}

export async function adminDeleteCommentAction(postId: string, commentId: string) {
  await requireAdmin();
  await connectDB();
  await Post.findByIdAndUpdate(postId, { $pull: { comments: { _id: commentId } } });

  revalidatePath("/admin/posts/" + postId + "/comments");
  revalidatePath("/admin/posts");
  revalidatePath("/posts/" + postId);
  return { success: true };
}

export async function adminClearAllCommentsAction(postId: string) {
  await requireAdmin();
  await connectDB();
  await Post.findByIdAndUpdate(postId, { comments: [] });

  revalidatePath("/admin/posts/" + postId + "/comments");
  revalidatePath("/admin/posts");
  revalidatePath("/posts/" + postId);
  return { success: true };
}