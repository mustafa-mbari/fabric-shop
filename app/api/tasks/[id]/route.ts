import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { taskUpdateSchema } from "@/lib/validation/task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const raw = await adminClient
    .from("tasks")
    .update(parsed.data as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const raw = await adminClient
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });

  return NextResponse.json({ success: true });
}
