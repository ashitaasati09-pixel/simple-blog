import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/session";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import UpdateProfileForm from "@/app/components/UpdateProfileForm";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { from } = await searchParams;
  const backUrl = from ?? "/profile/" + user.username;

  await connectDB();
  const rawUser = await User.findOne({ username: user.username }).lean();
  const dbUser = rawUser as unknown as {
    username: string;
    email: string;
    bio?: string;
    location?: string;
  } | null;

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
            borderRadius: "50%",
            background: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {user.username[0].toUpperCase()}
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
          Edit Profile
        </h1>

        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          Update your bio, location, username, and email.
        </p>
      </div>

      <UpdateProfileForm
        currentUsername={dbUser?.username ?? user.username}
        currentEmail={dbUser?.email ?? user.email}
        currentBio={dbUser?.bio ?? ""}
        currentLocation={dbUser?.location ?? ""}
        backUrl={backUrl}
      />
    </main>
  );
}