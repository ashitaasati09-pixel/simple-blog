import { getAllAdminsAction, getCurrentAdminUsername } from "@/app/lib/actions/admin-auth";
import AdminAdminsClient from "@/app/components/admin/AdminAdminsClient";

const ADMINS_PER_PAGE = 10;

interface AdminData {
  id: string; username: string; email: string;
  createdBy: string; ipAddress: string; createdAt: string;
}

export default async function AdminsManagePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const raw = await getAllAdminsAction();
  const currentUsername = await getCurrentAdminUsername();

  type RawAdmin = {
    _id: { toString: () => string }; username: string; email: string;
    createdBy?: string; ipAddress?: string; createdAt?: Date;
  };

  const allAdmins: AdminData[] = (raw as unknown as RawAdmin[]).map((a) => ({
    id: a._id.toString(), username: a.username, email: a.email,
    createdBy: a.createdBy || "—", ipAddress: a.ipAddress || "unknown",
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const totalCount = allAdmins.length;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const totalPages = Math.ceil(totalCount / ADMINS_PER_PAGE);
  const admins = allAdmins.slice((currentPage - 1) * ADMINS_PER_PAGE, currentPage * ADMINS_PER_PAGE);

  return (
    <AdminAdminsClient
      admins={admins} currentUsername={currentUsername}
      totalCount={totalCount} currentPage={currentPage} totalPages={totalPages}
    />
  );
}