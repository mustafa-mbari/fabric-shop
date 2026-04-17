import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserRole = "worker" | "manager" | "super_admin";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const roleLevel: Record<UserRole, number> = { worker: 0, manager: 1, super_admin: 2 };

export const getRole = cache(async (): Promise<UserRole | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return (data as unknown as UserRow).role as UserRole;
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

  if ((roleLevel[role] ?? 0) < (roleLevel[required] ?? 0)) {
    throw new Response(
      JSON.stringify({ error: "غير مصرح — صلاحيات غير كافية" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
}
