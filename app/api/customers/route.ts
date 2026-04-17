import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { customerCreateSchema } from "@/lib/validation/customer";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") ?? "";

  let query = supabase.from("customers").select("*").is("deleted_at", null).order("name");

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const raw = await query;
  const result = raw as unknown as { data: CustomerRow[] | null; error: unknown };

  if (!result.data) {
    return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = customerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient.from("customers").insert(parsed.data).select().single();
  const result = raw as unknown as { data: CustomerRow | null; error: { code?: string } | null };

  if (result.error) {
    if (result.error.code === "23505") {
      return NextResponse.json({ error: "رقم الهاتف مستخدم مسبقاً" }, { status: 409 });
    }
    return NextResponse.json({ error: "فشل إنشاء العميل" }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
