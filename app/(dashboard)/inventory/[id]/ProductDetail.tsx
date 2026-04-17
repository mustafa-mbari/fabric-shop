"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/forms/ProductForm";
import { useProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import type { ProductCreate } from "@/lib/validation/product";

export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: products, isLoading } = useProducts();
  const { mutateAsync: updateProduct } = useUpdateProduct(id);
  const { mutateAsync: deleteProduct } = useDeleteProduct();

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const product = products?.find((p) => p.id === id);

  useEffect(() => {
    if (!isLoading && products && !product) router.replace("/inventory");
  }, [isLoading, products, product, router]);

  async function handleSubmit(data: ProductCreate) {
    setError(null);
    setSaving(true);
    try {
      await updateProduct(data);
      router.push("/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProduct(id);
      router.push("/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading || !product) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → المخزون
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-5">تعديل المنتج</h2>
        <ProductForm
          defaultValues={{
            name:        product.name,
            type:        product.type,
            quantity:    product.quantity,
            description: product.description ?? undefined,
          }}
          onSubmit={handleSubmit}
          submitLabel="حفظ التعديلات"
          loading={saving}
          error={error}
        />
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">منطقة الخطر</p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200
                       rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-center"
          >
            حذف المنتج
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-700 text-center mb-3">
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                         rounded-xl py-2.5 disabled:opacity-60 transition-colors"
            >
              {deleting ? "جارٍ الحذف..." : "نعم، احذف المنتج"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full text-gray-600 text-sm font-medium border border-gray-200
                         rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
