"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const TABS = [
  { base: "/debts/wholesale", label: "بالجملة" },
  { base: "/debts/retail",    label: "بالمفرد" },
];

export default function DebtsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isDetailPage = !pathname.endsWith("/wholesale") && !pathname.endsWith("/retail");

  const currentSearch = searchParams.get("search") ?? "";
  const [inputValue, setInputValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input only when the tab (pathname) changes, NOT on every URL update.
  // Watching searchParams here would cause a loop: typing → debounce → URL update
  // → effect fires → input reset mid-typing → chars lost.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInputValue(searchParams.get("search") ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const currentTab = pathname.endsWith("/retail") ? "retail" : "wholesale";
      const url = value.trim()
        ? `/debts/${currentTab}?search=${encodeURIComponent(value.trim())}`
        : `/debts/${currentTab}`;
      router.replace(url);
    }, 300);
  }

  if (isDetailPage) return <>{children}</>;

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-3">
        <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="search"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="ابحث باسم العميل..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 ps-9 pe-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {TABS.map((tab) => {
          const active = pathname === tab.base;
          const tabHref = currentSearch
            ? `${tab.base}?search=${encodeURIComponent(currentSearch)}`
            : tab.base;
          return (
            <Link
              key={tab.base}
              href={tabHref}
              className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </>
  );
}
