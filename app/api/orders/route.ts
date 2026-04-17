import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { orderCreateSchema } from "@/lib/validation/order";

export type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  status: "NEW" | "IN_PROGRESS" | "ON_HOLD" | "READY" | "DELIVERED";
  total_price: number;
  notes: string | null;
  delivery_date: string | null;
  created_by: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status      = searchParams.get("status");
  const customerId  = searchParams.get("customer_id");

  let query = supabase
    .from("orders")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status)     query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);

  const raw = await query;
  const result = raw as unknown as { data: OrderRow[] | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { customer_id, customer_name, status, notes, delivery_date, items } = parsed.data;

  // Use RPC for atomic order + items insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (adminClient.rpc as any)("create_order_with_items", {
    p_customer_id:   customer_id ?? null,
    p_customer_name: customer_name ?? null,
    p_status:        status,
    p_notes:         notes ?? null,
    p_delivery_date: delivery_date ?? null,
    p_created_by:    user.id,
    p_items:         items,
  });
  const result = raw as unknown as { data: string | null; error: unknown };

  if (!result.data) return NextResponse.json({ error: "فشل إنشاء الطلب" }, { status: 500 });

  return NextResponse.json({ data: { id: result.data } }, { status: 201 });
}
