"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DebtForm from "@/components/forms/DebtForm";
import { useCreateDebt } from "@/hooks/useDebts";
import type { DebtCreate } from "@/lib/validation/debt";

export default function NewDebtForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get("type") ?? "WHOLESALE") as "WHOLESALE" | "RETAIL";

  const { mutateAsync: createDebt } = useCreateDebt();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: DebtCreate) {
    setError(null);
    setLoading(true);
    try {
      const result = await createDebt(data);
      router.push(`/debts/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  const backHref = defaultType === "RETAIL" ? "/debts/retail" : "/debts/wholesale";

  return (
    <div className="max-w-lg">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → الديون
      </Link>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">تسجيل دين جديد</h2>
        <DebtForm
          defaultType={defaultType}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
