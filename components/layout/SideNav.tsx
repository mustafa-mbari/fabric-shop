"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNavItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/customers", label: "العملاء" },
  { href: "/orders", label: "الطلبات" },
  { href: "/debts/wholesale", label: "الديون" },
  { href: "/inventory", label: "المخزون" },
  { href: "/tasks", label: "المهام" },
];

const managerNavItems = [{ href: "/admin/users", label: "المستخدمون" }];

interface SideNavProps {
  isManager?: boolean;
}

export default function SideNav({ isManager = false }: SideNavProps) {
  const pathname = usePathname();
  const navItems = isManager ? [...baseNavItems, ...managerNavItems] : baseNavItems;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    const base = href.split("/").slice(0, 2).join("/");
    return pathname.startsWith(base);
  }

  return (
    <aside
      className="hidden md:flex flex-col w-56 min-h-screen bg-white border-e border-gray-200 sticky top-0 shrink-0"
      aria-label="القائمة الجانبية"
    >
      <div className="px-4 py-5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">مدير الأقمشة</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-colors duration-150
                          ${
                            active
                              ? "bg-brand-50 text-brand-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
