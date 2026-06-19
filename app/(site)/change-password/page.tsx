import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import ChangePasswordForm from "@/app/components/ChangePasswordForm";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { from } = await searchParams;
  const backUrl = from ?? "/";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>

      <a
        href={backUrl}
        style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
      >
        Back
      </a>

      <div style={{ margin: "20px 0 32px" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          🔑
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
          Change Password
        </h1>

        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          Keep your account secure with a strong password.
        </p>
      </div>

      <ChangePasswordForm />
    </main>
  );
}