"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrderForm from "@/components/forms/OrderForm";
import { useCreateOrder } from "@/hooks/useOrders";
import type { OrderCreate } from "@/lib/validation/order";

export default function NewOrderForm() {
  const router = useRouter();
  const { mutateAsync: createOrder } = useCreateOrder();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: OrderCreate) {
    setError(null);
    setLoading(true);
    try {
      const result = await createOrder(data);
      router.push(`/orders/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → الطلبات
      </Link>
      <OrderForm
        onSubmit={handleSubmit}
        submitLabel="إنشاء الطلب"
        loading={loading}
        error={error}
      />
    </div>
  );
}
