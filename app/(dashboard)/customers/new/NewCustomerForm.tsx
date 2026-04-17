"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerForm from "@/components/forms/CustomerForm";
import { useCreateCustomer } from "@/hooks/useCustomers";
import type { CustomerCreate } from "@/lib/validation/customer";

export default function NewCustomerForm() {
  const router = useRouter();
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: CustomerCreate) {
    setError(null);
    setLoading(true);
    try {
      await createCustomer(data);
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → العملاء
      </Link>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">بيانات العميل</h2>
        <CustomerForm
          onSubmit={handleSubmit}
          submitLabel="إضافة العميل"
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
