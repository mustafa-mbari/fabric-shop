import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { customerUpdateSchema } from "@/lib/validation/customer";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient
    .from("customers")
    .update(parsed.data)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  const result = raw as unknown as { data: CustomerRow | null; error: { code?: string } | null };

  if (result.error) {
    if (result.error.code === "23505") {
      return NextResponse.json({ error: "رقم الهاتف مستخدم مسبقاً" }, { status: 409 });
    }
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("manager");
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  const raw = await adminClient
    .from("customers")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };

  if (result.error) {
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
