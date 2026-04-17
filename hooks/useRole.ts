"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRole() {
  const [role, setRole] = useState<"manager" | "worker" | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setRole((user?.user_metadata?.role as "manager" | "worker") ?? "worker");
    });
  }, []);

  return { role, isManager: role === "manager" };
}
