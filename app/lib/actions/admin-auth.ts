"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/mongodb";
import Admin from "@/app/models/admin";
import { setAdminSession, destroyAdminSession } from "@/app/lib/admin-session";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getClientIp } from "@/app/lib/get-ip";

export async function adminLoginAction(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!username || !password) {
    return { error: "All fields are required." };
  }

  await connectDB();
  const admin = await Admin.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!admin) return { error: "Invalid username or password." };

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return { error: "Invalid username or password." };

  await setAdminSession(admin._id.toString());
  redirect("/admin");
}

export async function adminLogoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createNewAdminAction(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!username || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  await connectDB();
  const existing = await Admin.findOne({ $or: [{ username }, { email }] });
  if (existing) return { error: "Username or email already taken." };

  const ip = await getClientIp();
  const hashed = await bcrypt.hash(password, 12);
  await Admin.create({
    username, email, password: hashed,
    createdBy: currentAdmin.username, ipAddress: ip,
  });

  return { success: true };
}

export async function updateAdminAction(adminId: string, formData: FormData) {
  await requireAdmin();

  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!username || !email) {
    return { error: "Username and email are required." };
  }

  await connectDB();

  const existing = await Admin.findOne({
    _id: { $ne: adminId },
    $or: [{ username }, { email }],
  });
  if (existing) return { error: "Username or email already taken by another admin." };

  const updateData: { username: string; email: string; password?: string } = {
    username, email,
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

  await Admin.findByIdAndUpdate(adminId, updateData);
  return { success: true };
}

export async function getAllAdminsAction() {
  await requireAdmin();
  await connectDB();
  const admins = await Admin.find({})
    .select("username email createdBy ipAddress createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return admins;
}

export async function getCurrentAdminUsername() {
  const admin = await requireAdmin();
  return admin.username;
}

// Self-deletion is blocked entirely — the UI no longer shows a Delete
// button for the logged-in admin's own row, and this is enforced here
// too as a safety net in case the action is ever called directly.
export async function deleteAdminAction(adminId: string) {
  const currentAdmin = await requireAdmin();
  await connectDB();

  const target = await Admin.findById(adminId).lean() as { username: string } | null;
  if (!target) return { error: "Admin not found." };

  if (target.username === currentAdmin.username) {
    return { error: "You cannot delete your own account." };
  }

  await Admin.findByIdAndDelete(adminId);
  return { success: true };
}