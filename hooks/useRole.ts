"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ClientRole = "worker" | "manager" | "super_admin";

export function useRole() {
  const [role, setRole] = useState<ClientRole | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setRole((user?.user_metadata?.role as ClientRole) ?? "worker");
    });
  }, []);

  return {
    role,
    isManager: role === "manager" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
  };
}
