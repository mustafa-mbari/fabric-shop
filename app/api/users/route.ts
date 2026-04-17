import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lightweight user list for assignment pickers (any authenticated user)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const raw = await supabase
    .from("users")
    .select("id, full_name, role")
    .is("deleted_at", null)
    .eq("status", "active" as never)
    .order("full_name");

  const result = raw as unknown as {
    data: Array<{ id: string; full_name: string | null; role: string }> | null;
    error: unknown;
  };

  if (!result.data) return NextResponse.json({ error: "فشل جلب المستخدمين" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}
