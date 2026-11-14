import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const checkoutSchema = z.object({
  universityId: z.string().uuid(),
  planSlug: z.string().min(2),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function POST(request: Request) {
  const provider = process.env.PAYMENT_PROVIDER;
  const secretKey = process.env.PAYMENT_SECRET_KEY;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  // Strictly verify caller is Super Admin or verified University Admin for that university
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("global_role").eq("id", user.id).single(),
    supabase
      .from("university_members")
      .select("role, status")
      .eq("university_id", parsed.data.universityId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isAuthorized =
    profile?.global_role === "super_admin" ||
    (membership?.role === "university_admin" && membership?.status === "verified");

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!provider || !secretKey) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Live payment provider credentials (PAYMENT_PROVIDER / PAYMENT_SECRET_KEY) are not configured yet. Super Admin can assign or invoice plans manually in Subscriptions & Payments.",
      },
      { status: 503 }
    );
  }

  await writeAuditLog({
    actorId: user.id,
    universityId: parsed.data.universityId,
    action: "billing.checkout_initiated",
    entityType: "subscriptions",
    newValues: { planSlug: parsed.data.planSlug, billingCycle: parsed.data.billingCycle, provider },
  });

  return NextResponse.json({
    configured: true,
    provider,
    message: "Provider session ready",
  });
}
