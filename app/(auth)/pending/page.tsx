"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    const supabase = createClient();
    await supabase.auth.refreshSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.user_metadata?.status === "active") {
      router.push("/");
      router.refresh();
    } else {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="w-full max-w-sm">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
          <span className="text-3xl">🧵</span>
        </div>
        <h1 className="text-2xl font-bold text-white">مدير محل الأقمشة</h1>
        <p className="mt-1 text-sm text-blue-200">نظام الإدارة الداخلي</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-7 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          طلبك قيد المراجعة
        </h2>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          تم استلام طلب تسجيلك. سيقوم المدير بمراجعته والموافقة عليه قريباً.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white
                       disabled:opacity-60 min-h-[48px]"
            style={{ background: checking ? "#6b7280" : "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            {checking ? "جارٍ التحقق..." : "تحقق من الحالة"}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium
                       rounded-xl py-3 text-sm border border-gray-200
                       transition-colors duration-150 min-h-[48px]"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
