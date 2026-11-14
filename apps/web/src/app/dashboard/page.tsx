import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (auth.effectiveRole === "super_admin") redirect("/admin");
  redirect("/portal/dashboard");
}
