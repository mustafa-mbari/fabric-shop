import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAnyRole } from "@/lib/auth/requireRole";
import { productCreateSchema } from "@/lib/validation/product";

type ProductRow = {
  id: string;
  name: string;
  type: "METER" | "UNIT";
  product_type: string | null;
  quantity: number;
  color: string | null;
  price: number | null;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search       = searchParams.get("search")?.trim() ?? "";
  const type         = searchParams.get("type");
  const productType  = searchParams.get("product_type")?.trim();
  const color        = searchParams.get("color")?.trim();

  let query = supabase.from("products").select("*").is("deleted_at", null).order("name");
  if (search)                              query = query.ilike("name", `%${search}%`);
  if (type === "METER" || type === "UNIT") query = query.eq("type", type);
  if (productType)                         query = query.ilike("product_type", `%${productType}%`);
  if (color)                               query = query.ilike("color", `%${color}%`);

  const raw = await query;
  const result = raw as unknown as { data: ProductRow[] | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  try { await requireAnyRole(["store_worker", "manager", "super_admin"]); } catch (res) { return res as Response; }

  const body = await request.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient.from("products").insert(parsed.data as never).select().single();
  const result = raw as unknown as { data: ProductRow | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل إنشاء المنتج" }, { status: 500 });

  return NextResponse.json({ data: result.data }, { status: 201 });
}
