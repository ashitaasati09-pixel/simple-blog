"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminCreateUserAction, adminUpdateUserAction, adminDeleteUserAction, adminToggleBanAction } from "@/app/lib/actions/admin";

interface UserData {
  id: string; username: string; email: string; bio: string; location: string;
  ipAddress: string; isBanned: boolean; postCount: number; joinedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getPaginationPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
  else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

export default function AdminUsersClient({
  users: initialUsers, totalCount, currentPage, totalPages,
}: {
  users: UserData[]; totalCount: number; currentPage: number; totalPages: number;
}) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [banTarget, setBanTarget] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [banError, setBanError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ✅ THE FIX: sync local state whenever the server sends a new page of users
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const input = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminCreateUserAction(formData);
      if (result?.error) { setError(result.error); return; }
      setShowCreate(false); (e.target as HTMLFormElement).reset(); router.refresh();
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editTarget) return; setEditError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminUpdateUserAction(editTarget.id, formData);
      if (result?.error) { setEditError(result.error); return; }
      setEditTarget(null); router.refresh();
    });
  }

  function handleDelete(user: UserData) {
    startTransition(async () => {
      await adminDeleteUserAction(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setDeleteTarget(null); router.refresh();
    });
  }

  function handleToggleBan() {
    if (!banTarget) return; setBanError("");
    const newBanState = !banTarget.isBanned;
    startTransition(async () => {
      const result = await adminToggleBanAction(banTarget.id, newBanState);
      if (result?.error) { setBanError(result.error); return; }
      setUsers((prev) => prev.map((u) => u.id === banTarget.id ? { ...u, isBanned: newBanState } : u));
      setBanTarget(null); router.refresh();
    });
  }

  function goToPage(p: number) {
    router.push(p === 1 ? "/admin/users" : `/admin/users?page=${p}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Users</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{totalCount} total site users</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: "10px 20px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Create User
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Create New Site User</h2>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input name="username" required placeholder="Username" style={input} />
              <input name="email" type="email" required placeholder="Email" style={input} />
              <input name="password" type="password" required placeholder="Password" style={input} />
              <input name="confirmPassword" type="password" required placeholder="Confirm Password" style={input} />
              <input name="bio" placeholder="Bio (optional)" style={input} />
              <input name="location" placeholder="Location (optional)" style={input} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={isPending}
                style={{ padding: "9px 20px", background: "#f97316", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Creating..." : "Create User"}
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
              {["User", "Email", "IP Address", "Status", "Posts", "Joined", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: user.isBanned ? "#9ca3af" : "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, color: user.isBanned ? "#9ca3af" : "#111" }}>{user.username}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "#6b7280" }}>{user.email}</td>
                <td style={{ padding: "14px 16px", color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>{user.ipAddress}</td>
                <td style={{ padding: "14px 16px" }}>
                  {user.isBanned
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 50, padding: "3px 10px" }}>Banned</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 50, padding: "3px 10px" }}>Active</span>}
                </td>
                <td style={{ padding: "14px 16px", color: "#374151" }}>{user.postCount}</td>
                <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{formatDate(user.joinedAt)}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setEditTarget(user)}
                      style={{ padding: "5px 12px", border: "1px solid #f97316", borderRadius: 6, background: "#fff", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                    <button type="button" onClick={() => { setBanError(""); setBanTarget(user); }}
                      style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: user.isBanned ? "1px solid #16a34a" : "1px solid #f59e0b", background: "#fff", color: user.isBanned ? "#16a34a" : "#f59e0b" }}>
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                    <button onClick={() => setDeleteTarget(user)}
                      style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
            Page {currentPage} of {totalPages} · {totalCount} users
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              ← Prev
            </button>
            {paginationPages.map((pg, i) =>
              pg === "..." ? (
                <span key={"e" + i} style={{ padding: "8px 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
              ) : (
                <button key={pg} onClick={() => goToPage(pg as number)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: pg === currentPage ? "none" : "1.5px solid #e5e7eb", background: pg === currentPage ? "#f97316" : "#fff", color: pg === currentPage ? "#fff" : "#374151", fontSize: 13, fontWeight: pg === currentPage ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#f97316"; }}
                  onMouseLeave={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                  {pg}
                </button>
              )
            )}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
              style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === totalPages ? "#f9fafb" : "#fff", color: currentPage === totalPages ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: "40px 16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 460 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Edit User</h3>
            {editError && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>{editError}</div>}
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Bio</label>
                <textarea name="bio" defaultValue={editTarget.bio} rows={3} style={{ ...input, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Location</label>
                <input name="location" defaultValue={editTarget.location} style={input} />
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

      {/* Ban modal */}
      {banTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 380 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>{banTarget.isBanned ? "Unban this user?" : "Ban this user?"}</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              {banTarget.isBanned
                ? <>Restoring access — <strong>{banTarget.username}</strong> will be able to log in again.</>
                : <><strong>{banTarget.username}</strong> will no longer be able to log in.</>}
            </p>
            {banError && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 13 }}>{banError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleToggleBan} disabled={isPending}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", background: banTarget.isBanned ? "#16a34a" : "#f59e0b", opacity: isPending ? 0.7 : 1 }}>
                {isPending ? "Saving..." : banTarget.isBanned ? "Unban User" : "Ban User"}
              </button>
              <button type="button" onClick={() => { setBanTarget(null); setBanError(""); }}
                style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 360 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Delete user?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px" }}>This will permanently delete <strong>{deleteTarget.username}</strong> and all their posts.</p>
            <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 20px" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleDelete(deleteTarget)} disabled={isPending}
                style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)}
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