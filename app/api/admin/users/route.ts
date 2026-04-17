import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "rejected"]),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireRole("manager");
  } catch (res) {
    return res as Response;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { userId, status } = parsed.data;

  // Update status in public.users
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("users")
    .update({ status } as never)
    .eq("id", userId);

  if (dbError) {
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }

  // Also update user_metadata so the middleware can read it from the JWT
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status },
  });

  if (authError) {
    return NextResponse.json({ error: "فشل تحديث بيانات المستخدم" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  try {
    await requireRole("manager");
  } catch (res) {
    return res as Response;
  }

  const supabase = await createClient();
  const raw = await supabase.from("users").select("*").order("created_at", { ascending: false });
  const result = raw as unknown as { data: Array<{
    id: string;
    full_name: string | null;
    role: string;
    status: string;
    created_at: string;
    deleted_at: string | null;
  }> | null; error: unknown };

  if (!result.data) {
    return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
