"use client";

import { useState } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { useRole } from "@/hooks/useRole";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

const typeLabel: Record<string, { text: string; className: string }> = {
  METER: { text: "متر",   className: "bg-blue-100 text-blue-700" },
  UNIT:  { text: "وحدة",  className: "bg-purple-100 text-purple-700" },
};

function quantityColor(qty: number) {
  if (qty === 0) return "text-red-600 font-semibold";
  if (qty <= 5)  return "text-yellow-600 font-semibold";
  return "text-green-700 font-semibold";
}

export default function InventoryList() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, isError } = useProducts(search);
  const { isManager } = useRole();

  return (
    <>
      {/* Search + add button */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0Z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المنتج..."
            className="w-full rounded-xl border border-gray-200 bg-white pe-10 ps-4 py-2.5
                       text-sm text-gray-900 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        {isManager && (
          <Link
            href="/inventory/new"
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">منتج جديد</span>
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
          تعذّر تحميل المخزون. يرجى المحاولة مجدداً.
        </div>
      )}

      {!isLoading && !isError && products?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">{search ? "لا توجد نتائج مطابقة" : "لا يوجد منتجات في المخزون"}</p>
          {!search && isManager && (
            <Link href="/inventory/new" className="mt-4 inline-block text-sm text-brand-600 font-medium hover:underline">
              أضف أول منتج
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && products && products.length > 0 && (
        <>
          {/* Cards — mobile */}
          <div className="space-y-2 md:hidden">
            {products.map((p) => {
              const badge = typeLabel[p.type] ?? typeLabel["UNIT"]!;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>
                      )}
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`text-lg leading-none ${quantityColor(p.quantity)}`}>
                        {p.quantity}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{badge.text}</p>
                    </div>
                  </div>
                  {isManager && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Link
                        href={`/inventory/${p.id}`}
                        className="text-sm text-brand-600 font-medium hover:underline"
                      >
                        تعديل الكمية
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start ps-5 pe-3 py-3 font-medium text-gray-600">المنتج</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">النوع</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الكمية</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الوصف</th>
                  {isManager && <th className="py-3 pe-4" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const badge = typeLabel[p.type] ?? typeLabel["UNIT"]!;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="ps-5 pe-3 py-3.5 font-medium text-gray-900">{p.name}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className={`px-3 py-3.5 ${quantityColor(p.quantity)}`}>{p.quantity}</td>
                      <td className="px-3 py-3.5 text-gray-500 truncate max-w-xs">{p.description ?? "—"}</td>
                      {isManager && (
                        <td className="pe-4 py-3.5 text-end">
                          <Link
                            href={`/inventory/${p.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            تعديل ←
                          </Link>
                        </td>
                      )}
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
