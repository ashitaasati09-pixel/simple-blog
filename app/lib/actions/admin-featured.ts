"use server";
import { connectDB } from "@/app/lib/mongodb";
import { Post } from "@/app/models/post";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin-auth";

export async function toggleFeaturedAction(
  postId: string,
  newFeatured: boolean
): Promise<{ error?: string; featured?: boolean }> {
  try {
    await requireAdmin();

    if (!postId || typeof postId !== "string") {
      return { error: "Invalid post ID" };
    }

    if (typeof newFeatured !== "boolean") {
      return { error: "Invalid featured value" };
    }

    await connectDB();

    // When featuring: set featuredAt = now so home page always shows most recently featured
    // When unfeaturing: remove featuredAt
    const updateData = newFeatured
      ? { $set: { featured: true, featuredAt: new Date() } }
      : { $set: { featured: false }, $unset: { featuredAt: "" } };

    const updated = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, lean: true }
    ) as { featured?: boolean } | null;

    if (!updated) return { error: "Post not found" };

    revalidatePath("/");
    revalidatePath("/featured");
    revalidatePath("/admin/featured");
    revalidatePath("/admin/posts");

    return { featured: newFeatured };
  } catch (err: unknown) {
    console.error("[toggleFeaturedAction] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}