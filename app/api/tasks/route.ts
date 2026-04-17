import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { taskCreateSchema } from "@/lib/validation/task";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  done: boolean;
  created_at: string;
  users_assigned: { full_name: string | null } | null;
  users_created:  { full_name: string | null } | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const done = request.nextUrl.searchParams.get("done");

  let query = supabase
    .from("tasks")
    .select(`
      *,
      users_assigned:users!tasks_assigned_to_fkey(full_name),
      users_created:users!tasks_created_by_fkey(full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (done === "true")  query = query.eq("done", true);
  if (done === "false") query = query.eq("done", false);

  const raw = await query;
  const result = raw as unknown as { data: TaskRow[] | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل جلب المهام" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const raw = await adminClient
    .from("tasks")
    .insert({ ...parsed.data, created_by: user.id } as never)
    .select("id")
    .single();
  const result = raw as unknown as { data: { id: string } | null; error: unknown };
  if (!result.data) return NextResponse.json({ error: "فشل إنشاء المهمة" }, { status: 500 });

  return NextResponse.json({ data: result.data }, { status: 201 });
}
