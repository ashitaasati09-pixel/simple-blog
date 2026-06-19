"use client";
import { useState } from "react";
import { loginAction } from "@/app/lib/actions/login";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fafafa",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        padding: "40px 36px",
      }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#f97316",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, marginBottom: 12,
          }}>✏️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>
            Simple<span style={{ color: "#f97316" }}>Blog</span>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0" }}>
            Welcome back
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} method="POST">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Username or Email
            </label>
            <input
              type="text"
              name="username"
              placeholder="you@example.com"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 13px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                color: "#111",
                background: "#fff",
                outline: "none",
                fontFamily: "'Segoe UI', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "#f97316", textDecoration: "none" }}>
                Forgot?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 40px 11px 13px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#111",
                  background: "#fff",
                  outline: "none",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: 15, color: "#9ca3af",
                  padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
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
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}