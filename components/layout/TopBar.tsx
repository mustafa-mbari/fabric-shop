import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface TopBarProps {
  title: string;
}

export default async function TopBar({ title }: TopBarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserRow | null = null;
  if (user) {
    const raw = await supabase.from("users").select("*").eq("id", user.id).single();
    profile = (raw as unknown as { data: UserRow | null }).data;
  }

  const displayName = profile?.full_name ?? user?.email ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "؟";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
        {profile && (
          <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="حسابي">
            <div className="text-end hidden sm:block">
              <p className="text-xs font-medium text-gray-900 leading-none">
                {profile.full_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {profile.role === "super_admin" ? "مدير عام" : profile.role === "manager" ? "مدير" : "موظف"}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center
                         justify-center text-sm font-semibold shrink-0"
            >
              {initial}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
