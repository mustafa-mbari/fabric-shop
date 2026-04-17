import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { formatMoney } from "@/lib/utils/money";
import Link from "next/link";

async function getSummary(): Promise<DashboardSummary | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (supabase.rpc as any)("dashboard_summary");
  const result = raw as unknown as { data: DashboardSummary | null; error: unknown };
  return result.data ?? null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;
  const isManager = role === "manager" || role === "super_admin";

  const summary = await getSummary();

  const stats = [
    {
      label: "طلبات اليوم",
      value: summary ? String(summary.orders_today) : "—",
      color: "text-blue-600",
    },
    {
      label: "قيد التنفيذ",
      value: summary ? String(summary.orders_in_progress) : "—",
      color: "text-amber-600",
    },
    {
      label: "إجمالي الديون",
      value: summary ? formatMoney(summary.total_debt_remaining) : "—",
      color: "text-red-600",
    },
    {
      label: "العملاء",
      value: summary ? String(summary.total_customers) : "—",
      color: "text-green-600",
    },
  ];

  return (
    <AppShell title="الرئيسية">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {summary && summary.tasks_pending > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-amber-600 text-xl">⚑</span>
            <p className="text-sm text-amber-800">
              {summary.tasks_pending === 1
                ? "لديك مهمة واحدة معلقة"
                : `لديك ${summary.tasks_pending} مهام معلقة`}
            </p>
          </div>
        )}

        {/* Quick links — visible on mobile only (side nav handles desktop) */}
        <div className="md:hidden">
          <h2 className="text-xs font-medium text-gray-500 mb-2">روابط سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/account"
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1.5 active:bg-gray-50"
            >
              <span className="text-xl">👤</span>
              <span className="text-sm font-medium text-gray-800">حسابي</span>
            </Link>
            {isManager && (
              <Link
                href="/admin/users"
                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1.5 active:bg-gray-50"
              >
                <span className="text-xl">👥</span>
                <span className="text-sm font-medium text-gray-800">إدارة المستخدمين</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
