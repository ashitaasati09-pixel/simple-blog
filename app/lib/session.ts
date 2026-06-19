import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;

  if (!userId) return null;

  await connectDB();
  const user = await User.findById(userId)
    .select("username email isBanned")
    .lean() as { username: string; email: string; isBanned?: boolean } | null;

  if (!user) return null;

  // If the user has been banned since they logged in, force them out
  // by clearing the cookie and treating them as logged-out everywhere.
  if (user.isBanned) {
    cookieStore.set("session_user", "", { expires: new Date(0), path: "/" });
    return null;
  }

  return user;
}