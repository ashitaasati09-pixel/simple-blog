"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/lib/actions/post";

type User = { username: string; email: string } | null;

export default function HomeClient({ user }: { user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 28px",
        height: 60,
        borderBottom: "1px solid #f0f0f0",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9, background: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}
        >
          ✏️
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
          Simple<span style={{ color: "#f97316" }}>Blog</span>
        </span>
      </Link>

      <a
        href={user ? "/create?from=" + pathname : "/login"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 22px", background: "#f97316", color: "#fff",
          borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700,
          boxShadow: "0 2px 10px rgba(249,115,22,0.25)",
        }}
      >
        Write a post
      </a>

      {user ? (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 8px", borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: "50%", background: "#f97316",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 14, fontWeight: 700,
              }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
              {user.username}
            </span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 12, padding: "6px 0", minWidth: 220,
                boxShadow: "0 8px 28px rgba(0,0,0,0.1)", zIndex: 200,
              }}
            >
              <a
                href={"/profile/" + user.username + "?from=" + pathname}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", fontSize: 13, color: "#374151",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 15 }}>👤</span>
                My Profile
              </a>

              <a
                href={"/change-password?from=" + pathname}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", fontSize: 13, color: "#374151",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 15 }}>🔑</span>
                Change Password
              </a>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />

              <form action={logoutAction}>
                <button
                  type="submit"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 16px",
                    background: "none", border: "none",
                    fontSize: 13, color: "#dc2626", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  🚪 Log out
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{
            padding: "8px 18px", borderRadius: 8,
            border: "1px solid #e5e7eb", color: "#374151",
            textDecoration: "none", fontSize: 13, fontWeight: 500,
          }}>
            Log in
          </Link>
          <Link href="/signup" style={{
            padding: "8px 18px", borderRadius: 8,
            background: "#f97316", color: "#fff",
            textDecoration: "none", fontSize: 13, fontWeight: 600,
          }}>
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}