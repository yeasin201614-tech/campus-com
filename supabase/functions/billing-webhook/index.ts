// Supabase Edge Function: billing-webhook
// Credential-gated payment webhook processor. Never stores raw card details.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Payment provider credentials are not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const signature = req.headers.get("x-campus-webhook-secret");
  if (signature !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (payload.type === "invoice.paid" && payload.university_id) {
    const invoiceNumber = payload.invoice_number ?? `INV-${Date.now()}`;
    await serviceClient.from("payments").insert({
      university_id: payload.university_id,
      subscription_id: payload.subscription_id ?? null,
      amount: Number(payload.amount ?? 0),
      currency: payload.currency ?? "USD",
      status: "succeeded",
      invoice_number: invoiceNumber,
      payment_method_summary: payload.payment_method_summary ?? "Verified Provider",
      provider: payload.provider ?? "stripe",
      provider_payment_id: payload.provider_payment_id ?? null,
      paid_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
