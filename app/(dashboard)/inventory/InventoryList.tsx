"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useRole } from "@/hooks/useRole";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import ActionMenu from "@/components/ui/ActionMenu";
import { formatMoney } from "@/lib/utils/money";

const measureLabel: Record<string, { text: string; className: string }> = {
  METER: { text: "متر",   className: "bg-blue-100 text-blue-700" },
  UNIT:  { text: "وحدة",  className: "bg-purple-100 text-purple-700" },
};

function quantityColor(qty: number) {
  if (qty === 0) return "text-red-600 font-semibold";
  if (qty <= 5)  return "text-yellow-600 font-semibold";
  return "text-green-700 font-semibold";
}

type MeasureFilter = "ALL" | "METER" | "UNIT";
type FilterField   = "name" | "productType" | "color" | "measure";

const FIELD_OPTIONS: { value: FilterField; label: string; placeholder?: string }[] = [
  { value: "name",        label: "اسم المنتج",  placeholder: "ابحث باسم المنتج..." },
  { value: "productType", label: "نوع المنتج",  placeholder: "مثال: قطن، حرير..." },
  { value: "color",       label: "اللون",        placeholder: "مثال: أحمر، أزرق..." },
  { value: "measure",     label: "نوع القياس" },
];

const MEASURE_FILTERS: { value: MeasureFilter; label: string }[] = [
  { value: "ALL",   label: "الكل" },
  { value: "METER", label: "متر" },
  { value: "UNIT",  label: "قطعة" },
];

export default function InventoryList() {
  const [filterField,   setFilterFieldState] = useState<FilterField>("name");
  const [filterText,    setFilterText]        = useState("");
  const [measureValue,  setMeasureValue]      = useState<MeasureFilter>("ALL");
  const [debouncedText, setDebouncedText]     = useState("");
  const router = useRouter();
  const { isManager } = useRole();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(filterText), 300);
    return () => clearTimeout(t);
  }, [filterText]);

  function switchField(field: FilterField) {
    setFilterFieldState(field);
    setFilterText("");
    setMeasureValue("ALL");
    setDebouncedText("");
  }

  const hasFilter =
    (filterField !== "measure" && debouncedText !== "") ||
    (filterField === "measure" && measureValue !== "ALL");

  const { data: products, isLoading, isError } = useProducts({
    search:      filterField === "name"        ? debouncedText || undefined : undefined,
    productType: filterField === "productType" ? debouncedText || undefined : undefined,
    color:       filterField === "color"       ? debouncedText || undefined : undefined,
    type:        filterField === "measure"     ? (measureValue === "ALL" ? undefined : measureValue) : undefined,
  });
  const { mutateAsync: deleteProduct } = useDeleteProduct();

  function menuItems(id: string) {
    return [
      ...(isManager ? [{ label: "تعديل", onClick: () => router.push(`/inventory/${id}`) }] : []),
      ...(isManager
        ? [{ label: "حذف", danger: true as const, requireConfirm: true, onClick: () => deleteProduct(id) }]
        : []),
    ];
  }

  const activePlaceholder = FIELD_OPTIONS.find((f) => f.value === filterField)?.placeholder ?? "";

  return (
    <>
      {/* Filter row: select + input/chips + add button */}
      <div className="flex gap-2 mb-4 items-center">
        {/* Field selector */}
        <select
          value={filterField}
          onChange={(e) => switchField(e.target.value as FilterField)}
          className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                     text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          {FIELD_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Value input — text or chips */}
        <div className="flex-1">
          {filterField !== "measure" ? (
            <div className="relative">
              <input
                key={filterField}
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={activePlaceholder}
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => { setFilterText(""); setDebouncedText(""); }}
                  className="absolute inset-y-0 end-2 flex items-center px-1 text-gray-400 hover:text-gray-600"
                  aria-label="مسح"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5">
              {MEASURE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setMeasureValue(f.value)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors border
                    ${measureValue === f.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
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
          <p className="text-sm">{hasFilter ? "لا توجد نتائج مطابقة" : "لا يوجد منتجات في المخزون"}</p>
          {!hasFilter && isManager && (
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
              const badge = measureLabel[p.type] ?? measureLabel["UNIT"]!;
              return (
                <div key={p.id} className="relative">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 pe-12">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.text}
                          </span>
                          {p.product_type && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {p.product_type}
                            </span>
                          )}
                          {p.color && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {p.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {p.price != null && (
                            <p className="text-xs text-brand-700 font-medium">{formatMoney(p.price)}</p>
                          )}
                          {p.description && (
                            <p className="text-xs text-gray-400 truncate">{p.description}</p>
                          )}
                        </div>
                        {p.price != null && p.quantity > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            الإجمالي: <span className="font-semibold text-gray-700">{formatMoney(Math.floor(p.price * p.quantity))}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-end shrink-0">
                        <p className={`text-lg leading-none ${quantityColor(p.quantity)}`}>
                          {p.quantity}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{badge.text}</p>
                      </div>
                    </div>
                  </div>
                  {isManager && (
                    <div className="absolute top-2 end-2">
                      <ActionMenu items={menuItems(p.id)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start ps-5 pe-3 py-3 font-medium text-gray-600">المنتج</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">نوع المنتج</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">المقياس</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">اللون</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">السعر</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الكمية</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">إجمالي المخزون</th>
                  {isManager && <th className="py-3 pe-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const badge = measureLabel[p.type] ?? measureLabel["UNIT"]!;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="ps-5 pe-3 py-3.5 font-medium text-gray-900">{p.name}</td>
                      <td className="px-3 py-3.5 text-gray-700">{p.product_type ?? "—"}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-gray-700">{p.color ?? "—"}</td>
                      <td className="px-3 py-3.5 text-brand-700 font-medium">
                        {p.price != null ? formatMoney(p.price) : "—"}
                      </td>
                      <td className={`px-3 py-3.5 ${quantityColor(p.quantity)}`}>{p.quantity}</td>
                      <td className="px-3 py-3.5 font-medium text-gray-800">
                        {p.price != null && p.quantity > 0
                          ? formatMoney(Math.floor(p.price * p.quantity))
                          : "—"}
                      </td>
                      {isManager && (
                        <td className="pe-3 py-3.5 text-end">
                          <ActionMenu items={menuItems(p.id)} />
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