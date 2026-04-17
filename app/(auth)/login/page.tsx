"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasRejected = searchParams.get("rejected") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    wasRejected ? "تم رفض طلب تسجيلك. تواصل مع المدير للمزيد من المعلومات." : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 overflow-hidden">
          <Image src="/icons/icon-192.png" width={80} height={80} alt="السيد" className="rounded-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-white">السيد</h1>
        <p className="mt-1 text-sm text-blue-200">نظام الإدارة الداخلي</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
          تسجيل الدخول
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         text-gray-900 placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         focus:bg-white transition-colors"
              placeholder="example@shop.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-base font-semibold text-white
                       transition-all duration-150 min-h-[48px] mt-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? "#6b7280" : "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            لا تملك حساباً؟{" "}
            <Link href="/register" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline">
              طلب التسجيل
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
