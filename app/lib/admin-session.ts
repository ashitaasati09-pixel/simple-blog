import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/mongodb";
import Admin from "@/app/models/admin";

export async function getSessionAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("session_admin")?.value;
  if (!adminId) return null;

  await connectDB();
  const admin = await Admin.findById(adminId)
    .select("username email")
    .lean() as { username: string; email: string } | null;

  return admin;
}

export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_admin", adminId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set("session_admin", "", { expires: new Date(0), path: "/" });
}