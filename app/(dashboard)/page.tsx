import AppShell from "@/components/layout/AppShell";

const stats = [
  { label: "طلبات اليوم", value: "—" },
  { label: "قيد التنفيذ", value: "—" },
  { label: "إجمالي الديون", value: "—" },
  { label: "العملاء", value: "—" },
] as const;

export default function DashboardPage() {
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 text-center pt-4">
          سيتم عرض الإحصائيات بعد إضافة البيانات
        </p>
      </div>
    </AppShell>
  );
}
