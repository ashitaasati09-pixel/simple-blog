"use client";
// SearchBar is now handled inline inside HomeClient.tsx
// This file is kept as a stub in case it's imported elsewhere.
// The full search bar with live dropdown lives in HomeClient.tsx

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push("/search?q=" + encodeURIComponent(query.trim()));
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 0, overflow: "hidden", borderRadius: 8, border: "1.5px solid #e5e7eb" }}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "9px 14px", border: "none", outline: "none",
          fontSize: 13, fontFamily: "inherit", background: "#f9fafb",
          color: "#374151", flex: 1,
        }}
      />
      <button
        type="submit"
        style={{
          background: "#f97316", color: "#fff", border: "none",
          padding: "9px 16px", cursor: "pointer", fontSize: 15,
        }}
      >
        🔍
      </button>
    </form>
  );
}