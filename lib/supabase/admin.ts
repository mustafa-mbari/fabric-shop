import { createClient } from "@supabase/supabase-js";

// Database generic is added after running: npx supabase gen types typescript --linked
// ONLY use inside Route Handlers (app/api/**). Never import in client components.
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
