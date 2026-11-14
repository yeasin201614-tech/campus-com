import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { count: unreadNotifCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .eq("is_read", false);

  return (
    <PortalShell
      profile={auth.profile}
      university={auth.university}
      effectiveRole={auth.effectiveRole}
      unreadNotifications={unreadNotifCount ?? 0}
      unreadMessages={0}
    >
      {children}
    </PortalShell>
  );
}
