import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function writeAuditLog(params: {
  actorId: string | null;
  universityId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("audit_logs").insert({
      actor_id: params.actorId,
      university_id: params.universityId ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
    });
  } catch {
    // Non-blocking audit logging fallback when DB isn't yet provisioned
  }
}
