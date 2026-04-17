import { createBrowserClient } from "@supabase/ssr";

// Database generic is added after running: npx supabase gen types typescript --linked
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
