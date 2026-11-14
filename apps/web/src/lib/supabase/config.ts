export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    !url!.includes("your-project-ref") &&
    !anonKey!.includes("your-supabase-anon-key");

  return {
    url: url || "https://placeholder.supabase.co",
    anonKey: anonKey || "placeholder-anon-key",
    isConfigured,
  };
}
