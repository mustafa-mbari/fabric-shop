"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/forms/ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";
import type { ProductCreate } from "@/lib/validation/product";

export default function NewProductForm() {
  const router = useRouter();
  const { mutateAsync: createProduct } = useCreateProduct();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: ProductCreate) {
    setError(null);
    setLoading(true);
    try {
      await createProduct(data);
      router.push("/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → المخزون
      </Link>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">إضافة منتج جديد</h2>
        <ProductForm
          onSubmit={handleSubmit}
          submitLabel="إضافة المنتج"
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
