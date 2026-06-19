"use client";
import { useState } from "react";
import { changePasswordAction } from "@/app/lib/actions/profile";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "11px 40px 11px 13px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  color: "#111",
  background: "#fff",
  outline: "none",
  fontFamily: "'Segoe UI', sans-serif",
};

function PasswordField({
  name,
  label,
  visible,
  onToggle,
}: {
  name: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 13,
        fontWeight: 600, color: "#374151", marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)",
            background: "none", border: "none",
            cursor: "pointer", fontSize: 15, color: "#9ca3af", padding: 0,
          }}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [show, setShow] = useState({ current: false, newP: false, confirm: false });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);
    if (result?.error) setError(result.error);
    if (result?.success) {
      setSuccess(result.success);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #e5e7eb", padding: "32px",
    }}>
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5",
          color: "#dc2626", borderRadius: 8,
          padding: "10px 14px", marginBottom: 20, fontSize: 13,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac",
          color: "#16a34a", borderRadius: 8,
          padding: "10px 14px", marginBottom: 20, fontSize: 13,
        }}>
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <PasswordField
          name="currentPassword"
          label="Current Password"
          visible={show.current}
          onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
        />
        <PasswordField
          name="newPassword"
          label="New Password"
          visible={show.newP}
          onToggle={() => setShow((s) => ({ ...s, newP: !s.newP }))}
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm New Password"
          visible={show.confirm}
          onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: loading ? "#fdba74" : "#f97316",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Segoe UI', sans-serif",
            marginTop: 4,
          }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}