import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { productUpdateSchema } from "@/lib/validation/product";

type ProductRow = {
  id: string;
  name: string;
  type: "METER" | "UNIT";
  quantity: number;
  color: string | null;
  price: number | null;
  description: string | null;
  created_at: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient
    .from("products")
    .update(parsed.data as never)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  const result = raw as unknown as { data: ProductRow | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const raw = await adminClient
    .from("products")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });

  return NextResponse.json({ success: true });
}
