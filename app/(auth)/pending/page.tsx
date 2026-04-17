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

    // Refresh the session to get updated metadata from the server
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">
          طلبك قيد المراجعة
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          تم استلام طلب تسجيلك. سيقوم المدير بمراجعته والموافقة عليه قريباً.
          <br />
          يمكنك التحقق من الحالة بالضغط على الزر أدناه.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-700
                       disabled:opacity-50 text-white font-medium rounded-lg py-3 text-sm
                       transition-colors duration-150 min-h-[48px]"
          >
            {checking ? "جارٍ التحقق..." : "تحقق من الحالة"}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium
                       rounded-lg py-3 text-sm border border-gray-300
                       transition-colors duration-150 min-h-[48px]"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
