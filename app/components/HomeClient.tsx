"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/lib/actions/post";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostResult {
  id: string;
  title: string;
  author: string;
}

interface AuthorResult {
  id: string;
  username: string;
}

type User = { username: string; email: string } | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#f59e0b",
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

// ─── HomeClient ───────────────────────────────────────────────────────────────

export default function HomeClient({ user }: { user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [authors, setAuthors] = useState<AuthorResult[]>([]);
  const [searching, setSearching] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Close menus when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mouseup", handleOutsideClick);
    return () => document.removeEventListener("mouseup", handleOutsideClick);
  }, []);

  // Fetch live search preview results
  const runPreview = useCallback(async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPosts((data.posts ?? []).slice(0, 4));
      setAuthors((data.authors ?? []).slice(0, 2));
    } catch {
      setPosts([]);
      setAuthors([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = inputVal.trim();
    if (trimmed) {
      debounceRef.current = setTimeout(() => runPreview(trimmed), 280);
    } else {
      setPosts([]);
      setAuthors([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputVal, runPreview]);

  function clearSearch() {
    setInputVal("");
    setPosts([]);
    setAuthors([]);
  }

  function goToSearch() {
    setFocused(false);
    const trimmed = inputVal.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") goToSearch();
  }

  const showDropdown =
    focused &&
    inputVal.trim().length > 0 &&
    (searching || posts.length > 0 || authors.length > 0);

  // ── Render ────────────────────────────────────────────────────────────────

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
      {/* ── Logo ── */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
          }}
        >
          ✏️
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
          Simple<span style={{ color: "#f97316" }}>Blog</span>
        </span>
      </Link>

      {/* ── Center: search + write ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* Search bar */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              border: focused ? "1.5px solid #f97316" : "1.5px solid #e5e7eb",
              borderRadius: 8,
              background: "#f9fafb",
              transition: "border-color 0.15s, width 0.2s",
              width: focused ? 340 : 240,
            }}
          >
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search posts, authors..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "10px 12px",
                fontSize: 13,
                color: "#374151",
                fontFamily: "inherit",
              }}
            />

            {inputVal && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 6px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}

            <button
              onClick={goToSearch}
              aria-label="Search"
              style={{
                background: "#f97316",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "10px 14px",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c0a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
            >
              🔍
            </button>
          </div>

          {/* Live dropdown */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                zIndex: 300,
                width: 360,
                overflow: "hidden",
              }}
            >
              {searching && (
                <div style={{ padding: "14px 16px", color: "#9ca3af", fontSize: 13 }}>
                  Searching…
                </div>
              )}

              {/* Authors */}
              {!searching && authors.length > 0 && (
                <div>
                  <SectionLabel>Authors</SectionLabel>
                  {authors.map((a) => (
                    <DropdownRow
                      key={a.id}
                      onClick={() => {
                        setFocused(false);
                        router.push(`/profile/${a.username}`);
                      }}
                    >
                      <Avatar name={a.username} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        {a.username}
                      </span>
                    </DropdownRow>
                  ))}
                </div>
              )}

              {/* Posts */}
              {!searching && posts.length > 0 && (
                <div>
                  {authors.length > 0 && <Divider />}
                  <SectionLabel>Posts</SectionLabel>
                  {posts.map((p) => (
                    <DropdownRow
                      key={p.id}
                      onClick={() => {
                        setFocused(false);
                        router.push(`/posts/${p.id}`);
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 2,
                          }}
                        >
                          <Avatar name={p.author} size={16} />
                          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>
                            {p.author}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111" }}>
                          {p.title.length > 50 ? `${p.title.slice(0, 50)}…` : p.title}
                        </p>
                      </div>
                    </DropdownRow>
                  ))}
                </div>
              )}

              {/* View all */}
              <DropdownRow
                onClick={goToSearch}
                style={{
                  borderTop: "1px solid #f5f5f5",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#f97316",
                  fontWeight: 600,
                }}
              >
                View all results for &ldquo;{inputVal}&rdquo; →
              </DropdownRow>
            </div>
          )}
        </div>

        {/* Write a post */}
        <Link
          href={user ? `/create?from=${pathname}` : "/login"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 22px",
            background: "#f97316",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 2px 10px rgba(249,115,22,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          ✏️ Write a post
        </Link>
      </div>

      {/* ── Right: user menu or login/signup ── */}
      {user ? (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
            }}
          >
            <Avatar name={user.username} size={34} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
              {user.username}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "6px 0",
                minWidth: 220,
                boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
                zIndex: 400,
              }}
            >
              <MenuLink
                href={`/profile/${user.username}`}
                icon="👤"
                label="My Profile"
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/change-password"
                icon="🔑"
                label="Change Password"
                onNavigate={() => setMenuOpen(false)}
              />

              <Divider />

              <form action={logoutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: "#dc2626",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
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
          <Link
            href="/login"
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              color: "#374151",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: "#f97316",
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 16px 4px",
        fontSize: 11,
        fontWeight: 700,
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />;
}

function DropdownRow({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        cursor: "pointer",
        background: "#fff",
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background =
          (style?.background as string) ?? "#fff")
      }
    >
      {children}
    </div>
  );
}

// ── FIX: use router.push inside onClick instead of onMouseDown ──
// This ensures navigation works even when the menu closes first.
function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  return (
    <button
      role="menuitem"
      onClick={() => {
        onNavigate();
        router.push(href);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 16px",
        fontSize: 13,
        color: "#374151",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <span style={{ fontSize: 15 }}>{icon}</span> {label}
    </button>
  );
}