"use client";
import { usePathname } from "next/navigation";

export function ProfileLink({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <a
      href={"/profile?from=" + pathname}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {children}
    </a>
  );
}

export function ChangePasswordLink({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <a
      href={"/change-password?from=" + pathname}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {children}
    </a>
  );
}

export function SearchLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="/search"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {children}
    </a>
  );
}

export function WritePostLink() {
  const pathname = usePathname();

  return (
    <a
      href={"/create?from=" + pathname}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 20px",
        background: "#f97316",
        color: "#fff",
        borderRadius: 8,
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "inherit",
      }}
    >
      Write a post
    </a>
  );
}