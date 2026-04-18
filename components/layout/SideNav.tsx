"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const allNavItems = [
  { href: "/",              label: "الرئيسية",  storeWorker: false },
  { href: "/customers",    label: "العملاء",   storeWorker: false },
  { href: "/orders",       label: "الطلبات",   storeWorker: false },
  { href: "/debts/wholesale", label: "الديون", storeWorker: false },
  { href: "/inventory",    label: "المخزون",   storeWorker: true  },
  { href: "/tasks",        label: "المهام",    storeWorker: true  },
];

const managerNavItems = [{ href: "/admin/users", label: "المستخدمون" }];

const accountItem = { href: "/account", label: "حسابي" };

interface SideNavProps {
  isManager?: boolean;
  isSuperAdmin?: boolean;
  isStoreWorker?: boolean;
}

export default function SideNav({ isManager = false, isSuperAdmin = false, isStoreWorker = false }: SideNavProps) {
  const pathname = usePathname();

  const filtered = allNavItems.filter((i) => !isStoreWorker || i.storeWorker);
  const navItems = (isManager || isSuperAdmin) ? [...filtered, ...managerNavItems] : filtered;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    const base = href.split("/").slice(0, 2).join("/");
    return pathname.startsWith(base);
  }

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${active
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <aside
      className="hidden md:flex flex-col w-56 min-h-screen bg-white border-e border-gray-200 sticky top-0 shrink-0"
      aria-label="القائمة الجانبية"
    >
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <Image
          src="/icons/icon-192.png"
          width={36}
          height={36}
          alt=""
          className="rounded-xl shrink-0"
        />
        <h2 className="text-sm font-bold text-gray-900 truncate">السيد</h2>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      {/* Account link at bottom */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <NavLink href={accountItem.href} label={accountItem.label} />
      </div>
    </aside>
  );
}
