"use client";
import { useState } from "react";
import { adminLoginAction } from "@/app/lib/actions/admin-auth";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await adminLoginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 14,
          padding: "36px 32px",
          border: "1px solid #eef1f5",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              margin: "0 auto 16px",
            }}
          >
            🛠️
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
            Admin Access
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Restricted area — authorized personnel only.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Username or Email
            </label>
            <input name="username" type="text" required style={input} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <input name="password" type="password" required style={input} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#fdba74" : "#f97316",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}