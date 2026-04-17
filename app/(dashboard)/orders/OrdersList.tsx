"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, useDeleteOrder, statusLabel, type OrderRow } from "@/hooks/useOrders";
import { useRole } from "@/hooks/useRole";
import { formatMoney } from "@/lib/utils/money";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import ActionMenu from "@/components/ui/ActionMenu";

const STATUS_FILTERS: Array<{ value: OrderRow["status"] | ""; label: string }> = [
  { value: "",            label: "الكل" },
  { value: "NEW",         label: "جديد" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "ON_HOLD",     label: "معلّق" },
  { value: "READY",       label: "جاهز" },
  { value: "DELIVERED",   label: "مُسلَّم" },
];

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ar-IQ", { day: "numeric", month: "short" });
}

export default function OrdersList() {
  const [statusFilter, setStatusFilter] = useState<OrderRow["status"] | "">("");
  const router = useRouter();
  const { isManager } = useRole();
  const { data: orders, isLoading, isError } = useOrders(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const { mutateAsync: deleteOrder } = useDeleteOrder();

  function menuItems(id: string) {
    return [
      { label: "التفاصيل / تعديل", onClick: () => router.push(`/orders/${id}`) },
      ...(isManager
        ? [{ label: "حذف", danger: true as const, requireConfirm: true, onClick: () => deleteOrder(id) }]
        : []),
    ];
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-medium text-gray-500">{orders?.length ?? 0} طلب</h1>
        <Link
          href="/orders/new"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
        >
          <span className="text-lg leading-none">+</span>
          <span>طلب جديد</span>
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as OrderRow["status"] | "")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors
              ${statusFilter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
          تعذّر تحميل الطلبات. يرجى المحاولة مجدداً.
        </div>
      )}

      {!isLoading && !isError && orders?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">{statusFilter ? "لا توجد طلبات بهذه الحالة" : "لا توجد طلبات بعد"}</p>
          {!statusFilter && (
            <Link href="/orders/new" className="mt-4 inline-block text-sm text-brand-600 font-medium hover:underline">
              أنشئ أول طلب
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && orders && orders.length > 0 && (
        <>
          {/* Cards — mobile */}
          <div className="space-y-2 md:hidden">
            {orders.map((o) => {
              const badge = statusLabel[o.status];
              return (
                <div key={o.id} className="relative">
                  <Link
                    href={`/orders/${o.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 pe-12 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {o.customer_name ?? "عميل غير محدد"}
                      </p>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{formatMoney(o.total_price)}</p>
                      {o.delivery_date && (
                        <p className="text-xs text-gray-400">تسليم: {formatDate(o.delivery_date)}</p>
                      )}
                    </div>
                  </Link>
                  <div className="absolute top-2 end-2">
                    <ActionMenu items={menuItems(o.id)} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start ps-5 pe-3 py-3 font-medium text-gray-600">العميل</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الإجمالي</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">التسليم</th>
                  <th className="py-3 pe-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const badge = statusLabel[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="ps-5 pe-3 py-3.5 font-medium text-gray-900">
                        {o.customer_name ?? "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-gray-800">{formatMoney(o.total_price)}</td>
                      <td className="px-3 py-3.5 text-gray-500">{formatDate(o.delivery_date) ?? "—"}</td>
                      <td className="pe-3 py-3.5 text-end">
                        <ActionMenu items={menuItems(o.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
