"use client";

import Link from "next/link";
import { useDebts, type DebtRow } from "@/hooks/useDebts";
import { formatMoney } from "@/lib/utils/money";

function statusBadge(debt: DebtRow) {
  if (debt.remaining === 0)
    return { text: "مسدّد",   className: "bg-green-100 text-green-700" };
  if (debt.amount_paid > 0)
    return { text: "جزئي",    className: "bg-yellow-100 text-yellow-700" };
  return   { text: "غير مسدّد", className: "bg-red-100 text-red-700" };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-IQ", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  type: "WHOLESALE" | "RETAIL";
}

export default function DebtsList({ type }: Props) {
  const { data: debts, isLoading, isError } = useDebts(type);
  const totalRemaining = debts?.reduce((s, d) => s + d.remaining, 0) ?? 0;

  return (
    <>
      {/* Summary + new button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500">إجمالي المتبقي</p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(totalRemaining)}</p>
        </div>
        <Link
          href={`/debts/new?type=${type}`}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
        >
          <span className="text-lg leading-none">+</span>
          <span>دين جديد</span>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
          تعذّر تحميل الديون. يرجى المحاولة مجدداً.
        </div>
      )}

      {!isLoading && !isError && debts?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-sm">لا توجد ديون {type === "WHOLESALE" ? "بالجملة" : "بالمفرد"}</p>
          <Link href={`/debts/new?type=${type}`} className="mt-4 inline-block text-sm text-brand-600 font-medium hover:underline">
            سجّل أول دين
          </Link>
        </div>
      )}

      {!isLoading && !isError && debts && debts.length > 0 && (
        <>
          {/* Cards — mobile */}
          <div className="space-y-2 md:hidden">
            {debts.map((d) => {
              const badge = statusBadge(d);
              return (
                <Link
                  key={d.id}
                  href={`/debts/${d.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {d.customers?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(d.created_at)}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">الإجمالي</p>
                      <p className="text-sm font-semibold text-gray-800">{formatMoney(d.amount_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">المدفوع</p>
                      <p className="text-sm font-semibold text-green-700">{formatMoney(d.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">المتبقي</p>
                      <p className={`text-sm font-bold ${d.remaining > 0 ? "text-red-600" : "text-green-700"}`}>
                        {formatMoney(d.remaining)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start ps-5 pe-3 py-3 font-medium text-gray-600">العميل</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الإجمالي</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">المدفوع</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">المتبقي</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="py-3 pe-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {debts.map((d) => {
                  const badge = statusBadge(d);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="ps-5 pe-3 py-3.5 font-medium text-gray-900">{d.customers?.name ?? "—"}</td>
                      <td className="px-3 py-3.5 text-gray-700">{formatMoney(d.amount_total)}</td>
                      <td className="px-3 py-3.5 text-green-700 font-medium">{formatMoney(d.amount_paid)}</td>
                      <td className={`px-3 py-3.5 font-bold ${d.remaining > 0 ? "text-red-600" : "text-green-700"}`}>
                        {formatMoney(d.remaining)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="pe-4 py-3.5 text-end">
                        <Link href={`/debts/${d.id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">
                          تفاصيل ←
                        </Link>
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
