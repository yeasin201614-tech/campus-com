import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireRole(["super_admin"]);
  return <AdminShell profile={auth.profile}>{children}</AdminShell>;
}
