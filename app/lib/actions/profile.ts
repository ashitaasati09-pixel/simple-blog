"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import bcrypt from "bcryptjs";

// ✅ UPDATE PROFILE
export async function updateProfileAction(formData: FormData) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { error: "Not authenticated." };
  }

  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const bio = (formData.get("bio") as string) || "";
  const location = (formData.get("location") as string) || "";

  if (!username || !email) {
    return { error: "Username and email are required." };
  }

  await connectDB();

  if (username !== sessionUser.username) {
    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return { error: "That username is already taken." };
    }
  }

  await User.updateOne(
    { email: sessionUser.email },
    { username, email, bio, location }
  );

  revalidatePath("/profile");

  return { success: "Profile updated successfully" };
}

// ✅ CHANGE PASSWORD
export async function changePasswordAction(formData: FormData) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  await connectDB();

  const user = await User.findOne({ email: sessionUser.email });

  if (!user) {
    return { error: "User not found" };
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();

  return { success: "Password updated successfully" };
}