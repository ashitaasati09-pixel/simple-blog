"use server";

import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";  // ← default import, not named
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signupAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const email = formData.get("email") as string;

  if (!username || !password || !email) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    console.log("Signup data:", { username, email });
    await connectDB();
    console.log("Connected to DB for signup");

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    console.log("Existing user check:", existing);
    if (existing) {
      return { error: "Username or email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("Creating new user:", { username, email });
    await User.create({ username, email, password: hashedPassword });
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An error occurred during signup. Please try again." };
  }

  redirect("/login");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_user");
  redirect("/login");
}