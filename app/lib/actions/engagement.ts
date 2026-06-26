"use server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";

// Toggle like for current user
export async function toggleLikeAction(postId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated." };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { error: "Post not found." };

  const idx = post.likes.indexOf(user.username);
  if (idx === -1) {
    post.likes.push(user.username);
  } else {
    post.likes.splice(idx, 1);
  }
  await post.save();

  revalidatePath("/posts/" + postId);
  revalidatePath("/");
  return { success: true, likes: post.likes };
}

// Add a comment
export async function addCommentAction(postId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated." };

  const text = (formData.get("text") as string)?.trim();
  if (!text) return { error: "Comment cannot be empty." };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { error: "Post not found." };

  post.comments.push({
    author: user.username,
    text,
    createdAt: new Date(),
  });
  await post.save();

  revalidatePath("/posts/" + postId);
  return { success: true };
}

// Delete a comment — allowed if you wrote it OR you're the post author
export async function deleteCommentAction(postId: string, commentId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated." };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { error: "Post not found." };

  const comment = post.comments.find(
    (c: { _id?: { toString: () => string } }) => c._id?.toString() === commentId
  );
  if (!comment) return { error: "Comment not found." };

  const isCommentOwner = comment.author === user.username;
  const isPostAuthor = post.author === user.username;

  if (!isCommentOwner && !isPostAuthor) {
    return { error: "Not authorized." };
  }

  post.comments = post.comments.filter(
    (c: { _id?: { toString: () => string } }) => c._id?.toString() !== commentId
  );
  await post.save();

  revalidatePath("/posts/" + postId);
  return { success: true };
}

// Post author removes a specific user's like
export async function removeLikeAction(postId: string, username: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated." };

  await connectDB();
  const post = await Post.findById(postId);
  if (!post) return { error: "Post not found." };

  if (post.author !== user.username) {
    return { error: "Not authorized." };
  }

  post.likes = post.likes.filter((u: string) => u !== username);
  await post.save();

  revalidatePath("/posts/" + postId);
  return { success: true };
}