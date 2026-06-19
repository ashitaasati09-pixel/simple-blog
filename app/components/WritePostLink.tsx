"use client";
import { usePathname } from "next/navigation";

export default function WritePostLink() {
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