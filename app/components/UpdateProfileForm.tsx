"use client";
import { useState } from "react";
import { updateProfileAction } from "@/app/lib/actions/profile";

export default function UpdateProfileForm({
  currentUsername,
  currentEmail,
  currentBio,
  currentLocation,
  backUrl,
}: {
  currentUsername: string;
  currentEmail: string;
  currentBio: string;
  currentLocation: string;
  backUrl: string;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [bio, setBio] = useState(currentBio);
  const [location, setLocation] = useState(currentLocation);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 15,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("bio", bio);
    formData.append("location", location);

    const result = await updateProfileAction(formData);

    if (result?.error) {
      setMessage(result.error);
    } else {
      setMessage("Profile updated successfully.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {message && (
        <div
          style={{
            background: message.includes("success") ? "#f0fdf4" : "#fef2f2",
            border: message.includes("success")
              ? "1px solid #bbf7d0"
              : "1px solid #fca5a5",
            color: message.includes("success") ? "#16a34a" : "#dc2626",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      <div>
        <label style={labelStyle}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell people about yourself..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      <div>
        <label style={labelStyle}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: "13px",
            background: loading ? "#fdba74" : "#f97316",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: loading ? "none" : "0 2px 10px rgba(249,115,22,0.28)",
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <a
          href={backUrl}
          style={{
            padding: "13px 24px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8,
            color: "#374151",
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}