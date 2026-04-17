import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { debtCreateSchema } from "@/lib/validation/debt";

export type DebtRow = {
  id: string;
  customer_id: string;
  type: "WHOLESALE" | "RETAIL";
  amount_total: number;
  amount_paid: number;
  remaining: number;
  note: string | null;
  order_id: string | null;
  created_by: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type       = searchParams.get("type");
  const customerId = searchParams.get("customer_id");

  let query = supabase
    .from("debts")
    .select("*, customers(name, phone)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (type)       query = query.eq("type", type);
  if (customerId) query = query.eq("customer_id", customerId);

  const raw = await query;
  const result = raw as unknown as { data: DebtRow[] | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = debtCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient
    .from("debts")
    .insert({ ...parsed.data, created_by: user.id } as never)
    .select("id")
    .single();
  const result = raw as unknown as { data: { id: string } | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل إنشاء الدين" }, { status: 500 });

  return NextResponse.json({ data: result.data }, { status: 201 });
}
