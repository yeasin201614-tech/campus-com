import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function GET() {
  const { isConfigured } = getSupabasePublicConfig();
  return NextResponse.json({
    ok: true,
    service: "campus-com-web",
    supabaseConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
}
