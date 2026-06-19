import { headers } from "next/headers";
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;

  const vercelIp = headersList.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  // No proxy headers present — this is normal on localhost in dev.
  return "127.0.0.1 (localhost/dev)";
}