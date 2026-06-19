import { requireAdmin } from "@/app/lib/admin-auth";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminSidebar username={admin.username} />
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );
}