"use client";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/lib/actions/admin-auth";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Admins", href: "/admin/admins", icon: "🛠" },
  { label: "Users", href: "/admin/users", icon: "◐" },
  { label: "Posts", href: "/admin/posts", icon: "▤" },
  { label: "Featured", href: "/admin/featured", icon: "⭐" },
];

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        width: 260,
        background: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        borderRight: "1px solid #eef1f5",
      }}
    >
      <div style={{ padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, background: "#f97316",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, color: "#fff",
            }}
          >
            ✏️
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>
            Simple<span style={{ color: "#f97316" }}>Blog</span>
          </span>
        </div>
      </div>

      <div style={{ padding: "8px 24px 8px", fontSize: 11, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.06em" }}>
        MENU
      </div>

      <nav style={{ flex: 1, padding: "0 14px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", marginBottom: 2,
                borderRadius: 8, textDecoration: "none",
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#f97316" : "#4b5563",
                background: isActive ? "#fff7ed" : "transparent",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}

        <div style={{ padding: "20px 10px 8px", fontSize: 11, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.06em" }}>
          SITE
        </div>
        <a
          href="/"
          target="_blank"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", borderRadius: 8, textDecoration: "none",
            fontSize: 14, fontWeight: 500, color: "#4b5563",
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>🌐</span>
          View Site
        </a>
      </nav>

      <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", marginBottom: 8 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%", background: "#f97316",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 13, fontWeight: 700,
            }}
          >
            {username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{username}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Administrator</div>
          </div>
        </div>
        <form action={adminLogoutAction}>
          <button
            type="submit"
            style={{
              width: "100%", padding: "9px", background: "#f9fafb",
              border: "1px solid #e5e7eb", borderRadius: 8, color: "#ef4444",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}