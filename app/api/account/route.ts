import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(1, "الاسم مطلوب").max(100),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const raw = await adminClient
    .from("users")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id)
    .select("id, full_name, role")
    .single();
  const result = raw as unknown as { data: { id: string; full_name: string; role: string } | null; error: unknown };

  if (result.error || !result.data) {
    return NextResponse.json({ error: "فشل تحديث الاسم" }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
