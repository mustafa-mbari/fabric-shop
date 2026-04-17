"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/debts/wholesale", label: "بالجملة" },
  { href: "/debts/retail",    label: "بالمفرد" },
];

export default function DebtsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show tabs on detail pages (e.g. /debts/[uuid])
  const isDetailPage = !pathname.endsWith("/wholesale") && !pathname.endsWith("/retail");
  if (isDetailPage) return <>{children}</>;

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
