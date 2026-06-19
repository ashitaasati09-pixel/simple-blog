import { getAllAdminsAction, getCurrentAdminUsername } from "@/app/lib/actions/admin-auth";
import AdminAdminsClient from "@/app/components/admin/AdminAdminsClient";

interface AdminData {
  id: string;
  username: string;
  email: string;
  createdBy: string;
  ipAddress: string;
  createdAt: string;
}

export default async function AdminsManagePage() {
  const raw = await getAllAdminsAction();
  const currentUsername = await getCurrentAdminUsername();

  type RawAdmin = {
    _id: { toString: () => string };
    username: string;
    email: string;
    createdBy?: string;
    ipAddress?: string;
    createdAt?: Date;
  };

  const admins: AdminData[] = (raw as unknown as RawAdmin[]).map((a) => ({
    id: a._id.toString(),
    username: a.username,
    email: a.email,
    createdBy: a.createdBy || "—",
    ipAddress: a.ipAddress || "unknown",
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return <AdminAdminsClient admins={admins} currentUsername={currentUsername} />;
}