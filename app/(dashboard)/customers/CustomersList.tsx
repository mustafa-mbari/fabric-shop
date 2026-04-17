"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerCardSkeleton } from "@/components/ui/Skeleton";

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25Z" />
    </svg>
  );
}

export default function CustomersList() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading, isError } = useCustomers(search);

  return (
    <>
      {/* Search + new button */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف..."
            className="w-full rounded-xl border border-gray-200 bg-white pe-10 ps-4 py-2.5
                       text-sm text-gray-900 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <Link
          href="/customers/new"
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">عميل جديد</span>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => <CustomerCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
          تعذّر تحميل العملاء. يرجى المحاولة مجدداً.
        </div>
      )}

      {!isLoading && !isError && customers?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">{search ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء بعد"}</p>
          {!search && (
            <Link href="/customers/new" className="mt-4 inline-block text-sm text-brand-600 font-medium hover:underline">
              أضف أول عميل
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && customers && customers.length > 0 && (
        <>
          {/* Cards — mobile */}
          <div className="space-y-2 md:hidden">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1" dir="ltr">
                      <PhoneIcon />
                      {c.phone}
                    </p>
                    {c.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{c.address}</p>
                    )}
                  </div>
                  <span className="text-gray-300 text-lg mt-0.5">›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start ps-5 pe-3 py-3 font-medium text-gray-600">الاسم</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">الهاتف</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-600">العنوان</th>
                  <th className="py-3 pe-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="ps-5 pe-3 py-3.5 font-medium text-gray-900">{c.name}</td>
                    <td className="px-3 py-3.5 text-gray-600" dir="ltr">{c.phone}</td>
                    <td className="px-3 py-3.5 text-gray-500">{c.address ?? "—"}</td>
                    <td className="pe-4 py-3.5 text-end">
                      <Link href={`/customers/${c.id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">
                        تعديل ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
