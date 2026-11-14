import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessagesClient, type ConversationRow } from "@/components/portal/MessagesClient";

export default async function PortalMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: memberships }, { data: peers }] = await Promise.all([
    supabase
      .from("conversation_members")
      .select("conversation_id, conversations(id, title, is_group, last_message_at, last_message_preview)")
      .eq("user_id", auth.userId),
    supabase
      .from("profiles")
      .select("id, full_name, online_status")
      .neq("id", auth.userId)
      .limit(30),
  ]);

  const conversations: ConversationRow[] = (memberships ?? [])
    .map((m) => m.conversations as unknown as ConversationRow | null)
    .filter((x): x is ConversationRow => Boolean(x))
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  return (
    <MessagesClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      initialConversations={conversations}
      peers={peers ?? []}
      initialConvId={c}
    />
  );
}
