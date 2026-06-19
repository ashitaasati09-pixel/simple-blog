import { getSessionUser } from "@/app/lib/session";
import HomeClient from "@/app/components/HomeClient";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const userData = user ? { username: user.username, email: user.email } : null;

  return (
    <div id="app-wrapper">
      <HomeClient user={userData} />
      {children}
    </div>
  );
}