import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "PAYMENT_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-campus-webhook-secret");
  if (signature !== webhookSecret) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.type === "invoice.paid" && body.universityId) {
    await admin.from("payments").insert({
      university_id: body.universityId,
      subscription_id: body.subscriptionId ?? null,
      amount: Number(body.amount ?? 0),
      currency: body.currency ?? "USD",
      status: "succeeded",
      invoice_number: body.invoiceNumber ?? `INV-${Date.now()}`,
      payment_method_summary: body.paymentMethodSummary ?? "Verified Gateway",
      provider: process.env.PAYMENT_PROVIDER ?? "configured_provider",
      provider_payment_id: body.providerPaymentId ?? null,
      paid_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
