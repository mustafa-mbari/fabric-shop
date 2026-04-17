import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { paymentCreateSchema } from "@/lib/validation/debt";

type PaymentRow = {
  id: string;
  debt_id: string;
  amount: number;
  note: string | null;
  created_at: string;
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
    .from("payments")
    .select("*")
    .eq("debt_id", id)
    .order("created_at", { ascending: false });
  const result = raw as unknown as { data: PaymentRow[] | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل جلب المدفوعات" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = paymentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient
    .from("payments")
    .insert({ ...parsed.data, debt_id: id } as never)
    .select()
    .single();
  const result = raw as unknown as { data: PaymentRow | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل تسجيل الدفعة" }, { status: 500 });

  return NextResponse.json({ data: result.data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id: debtId } = await params;
  const { searchParams } = request.nextUrl;
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "معرّف الدفعة مطلوب" }, { status: 400 });

  const raw = await adminClient
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("debt_id", debtId);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل حذف الدفعة" }, { status: 500 });

  return NextResponse.json({ success: true });
}
