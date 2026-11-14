import { NextResponse } from "next/server";
import { supportTicketSchema } from "@campus/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`contact:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = supportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Supabase credentials are not configured yet in .env.local." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user?.id ?? null,
    contact_name: parsed.data.contactName,
    contact_email: parsed.data.contactEmail,
    subject: parsed.data.subject,
    message: parsed.data.message,
    ticket_type: parsed.data.ticketType,
    target_type: parsed.data.targetType ?? null,
    target_id: parsed.data.targetId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
