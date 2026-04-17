import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserRole = "worker" | "manager";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export const getRole = cache(async (): Promise<UserRole | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const raw = await supabase.from("users").select("*").eq("id", user.id).single();
  const row = raw as unknown as { data: UserRow | null };

  if (!row.data) return null;
  return row.data.role;
});

// Usage in Route Handlers:
//   try { await requireRole("manager"); } catch (res) { return res as Response; }
export async function requireRole(required: UserRole): Promise<void> {
  const role = await getRole();

  if (!role) {
    throw new Response(
      JSON.stringify({ error: "غير مصرح — يجب تسجيل الدخول" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (required === "manager" && role !== "manager") {
    throw new Response(
      JSON.stringify({ error: "غير مصرح — هذا الإجراء مخصص للمدير فقط" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
}
