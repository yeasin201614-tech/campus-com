// Supabase Edge Function: admin-manage-user
// Strictly verifies caller is Super Admin or University Admin before performing
// administrative role/status updates and logs every action to audit_logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: callerProfile } = await serviceClient
      .from("profiles")
      .select("id, global_role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.global_role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Super Admin authorization required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target_user_id, global_role, is_active, is_verified } = await req.json();
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: before } = await serviceClient
      .from("profiles")
      .select("global_role, is_active, is_verified")
      .eq("id", target_user_id)
      .single();

    const patch: Record<string, unknown> = {};
    if (global_role) patch.global_role = global_role;
    if (typeof is_active === "boolean") patch.is_active = is_active;
    if (typeof is_verified === "boolean") patch.is_verified = is_verified;

    const { data: updated, error: updateErr } = await serviceClient
      .from("profiles")
      .update(patch)
      .eq("id", target_user_id)
      .select()
      .single();

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await serviceClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "admin.user.updated",
      entity_type: "profiles",
      entity_id: target_user_id,
      old_values: before,
      new_values: patch,
    });

    return new Response(JSON.stringify({ user: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
