import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type DashboardSummary = {
  total_customers: number;
  orders_today: number;
  orders_in_progress: number;
  total_debt_remaining: number;
  tasks_pending: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (supabase.rpc as any)("dashboard_summary");
  const result = raw as unknown as { data: DashboardSummary | null; error: unknown };

  if (!result.data) return NextResponse.json({ error: "فشل جلب الملخص" }, { status: 500 });

  return NextResponse.json({ data: result.data });
}
