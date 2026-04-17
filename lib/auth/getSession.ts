import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// cache() deduplicates calls within a single React render tree — one DB round-trip per request.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});
