import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  qrToken: z.string().min(4).max(128),
  eventId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid QR token" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("check_in_event_qr", {
    p_qr_token: parsed.data.qrToken.trim(),
    p_event_id: parsed.data.eventId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  await writeAuditLog({
    actorId: user.id,
    action: "event.qr_checkin",
    entityType: "event_registrations",
    entityId: parsed.data.qrToken,
    newValues: data as Record<string, unknown>,
  });

  return NextResponse.json(data);
}
