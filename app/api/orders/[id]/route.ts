import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import { orderUpdateSchema } from "@/lib/validation/order";

type OrderItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  status: string;
  total_price: number;
  notes: string | null;
  delivery_date: string | null;
  created_by: string;
  created_at: string;
  order_items: OrderItemRow[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const raw = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  const result = raw as unknown as { data: OrderRow | null; error: unknown };

  if (!result.data) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
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
  const parsed = orderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...headerFields } = parsed.data;

  // Update header
  if (Object.keys(headerFields).length > 0) {
    const raw = await adminClient
      .from("orders")
      .update(headerFields as never)
      .eq("id", id)
      .is("deleted_at", null);
    const result = raw as unknown as { error: unknown };
    if (result.error) return NextResponse.json({ error: "فشل تحديث الطلب" }, { status: 500 });
  }

  // Replace items atomically: delete then re-insert
  if (items && items.length > 0) {
    const delRaw = await adminClient.from("order_items").delete().eq("order_id", id);
    const delResult = delRaw as unknown as { error: unknown };
    if (delResult.error) return NextResponse.json({ error: "فشل تحديث المنتجات" }, { status: 500 });

    const insertRaw = await adminClient
      .from("order_items")
      .insert(items.map((item) => ({ ...item, order_id: id })));
    const insertResult = insertRaw as unknown as { error: unknown };
    if (insertResult.error) return NextResponse.json({ error: "فشل إعادة إدخال المنتجات" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireRole("manager"); } catch (res) { return res as Response; }

  const { id } = await params;
  const raw = await adminClient
    .from("orders")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  const result = raw as unknown as { error: unknown };
  if (result.error) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });

  return NextResponse.json({ success: true });
}
