"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNewAdminAction, updateAdminAction, deleteAdminAction } from "@/app/lib/actions/admin-auth";

interface AdminData {
  id: string;
  username: string;
  email: string;
  createdBy: string;
  ipAddress: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAdminsClient({
  admins,
  currentUsername,
}: {
  admins: AdminData[];
  currentUsername: string;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createNewAdminAction(formData);
      if (result?.error) { setError(result.error); return; }
      setShowCreate(false);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAdminAction(editTarget.id, formData);
      if (result?.error) { setEditError(result.error); return; }
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    startTransition(async () => {
      const result = await deleteAdminAction(deleteTarget.id);
      if (result?.error) { setDeleteError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Admins</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{admins.length} admin account{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "10px 20px", background: "#f97316", border: "none",
            borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          + Add Admin
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Add New Admin</h2>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input name="username" required placeholder="Username" style={input} />
              <input name="email" type="email" required placeholder="Email" style={input} />
              <input name="password" type="password" required placeholder="Password" style={input} />
              <input name="confirmPassword" type="password" required placeholder="Confirm Password" style={input} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={isPending}
                style={{ padding: "9px 20px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Adding..." : "Add Admin"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                style={{ padding: "9px 20px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Admin", "Email", "IP Address", "Created By", "Joined", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isSelf = admin.username === currentUsername;
              return (
                <tr key={admin.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                        {admin.username[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: "#111" }}>{admin.username}</span>
                      {isSelf && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 50, padding: "2px 8px" }}>
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>{admin.email}</td>
                  <td style={{ padding: "14px 16px", color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>{admin.ipAddress}</td>
                  <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{admin.createdBy}</td>
                  <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{formatDate(admin.createdAt)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setEditTarget(admin)}
                        style={{ padding: "5px 12px", border: "1px solid #f97316", borderRadius: 6, background: "#fff", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Edit
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 420 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Edit Admin</h3>
            {editError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Username</label>
                <input name="username" defaultValue={editTarget.username} required style={input} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Email</label>
                <input name="email" type="email" defaultValue={editTarget.email} required style={input} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  New Password <span style={{ color: "#9ca3af", fontWeight: 400 }}>(leave blank to keep current)</span>
                </label>
                <input name="password" type="password" placeholder="••••••••" style={input} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Confirm New Password</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" style={input} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={isPending}
                  style={{ flex: 1, padding: "10px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => { setEditTarget(null); setEditError(""); }}
                  style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 380 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Remove admin?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              Remove <strong>{deleteTarget.username}</strong>&apos;s admin access? They will no longer be able to log in to the admin panel.
            </p>
            {deleteError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 13 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDelete} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Removing..." : "Remove"}
              </button>
              <button onClick={() => { setDeleteTarget(null); setDeleteError(""); }}
                style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}