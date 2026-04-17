import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { debtUpdateSchema } from "@/lib/validation/debt";

type DebtDetail = {
  id: string;
  customer_id: string;
  type: string;
  amount_total: number;
  amount_paid: number;
  remaining: number;
  note: string | null;
  order_id: string | null;
  created_at: string;
  customers: { name: string; phone: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const raw = await supabase
    .from("debts")
    .select("*, customers(name, phone)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  const result = raw as unknown as { data: DebtDetail | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "الدين غير موجود" }, { status: 404 });

  return NextResponse.json({ data: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = debtUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const raw = await adminClient
    .from("debts")
    .update(parsed.data as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const raw = await adminClient
    .from("debts")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });

  return NextResponse.json({ success: true });
}
