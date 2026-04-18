import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { debtAddAmountSchema } from "@/lib/validation/debt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = debtAddAmountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: current, error: fetchError } = await adminClient
    .from("debts")
    .select("amount_total")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "الدين غير موجود" }, { status: 404 });
  }

  const { amount_total } = current as { amount_total: number };
  const newTotal = amount_total + parsed.data.amount;

  const updatePayload: Record<string, unknown> = { amount_total: newTotal };
  if (parsed.data.note) updatePayload.note = parsed.data.note;

  const { error: updateError } = await adminClient
    .from("debts")
    .update(updatePayload as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (updateError) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });

  const logEntry: Record<string, unknown> = {
    debt_id: id,
    amount: parsed.data.amount,
    type: "DEBT_ADDED",
  };
  if (parsed.data.note) logEntry.note = parsed.data.note;

  await adminClient.from("payments").insert(logEntry as never);

  return NextResponse.json({ success: true });
}
