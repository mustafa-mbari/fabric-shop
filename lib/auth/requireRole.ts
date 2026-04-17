import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "worker" | "manager";

export const getRole = cache(async (): Promise<UserRole | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const result = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (result.error || !result.data) return null;
  return result.data.role as UserRole;
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
