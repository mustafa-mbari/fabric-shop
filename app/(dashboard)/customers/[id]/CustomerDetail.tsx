"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerForm from "@/components/forms/CustomerForm";
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import type { CustomerCreate } from "@/lib/validation/customer";

export default function CustomerDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: customers, isLoading } = useCustomers();
  const { mutateAsync: updateCustomer } = useUpdateCustomer(id);
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const customer = customers?.find((c) => c.id === id);

  useEffect(() => {
    if (!isLoading && customers && !customer) {
      router.replace("/customers");
    }
  }, [isLoading, customers, customer, router]);

  async function handleSubmit(data: CustomerCreate) {
    setError(null);
    setSaving(true);
    try {
      await updateCustomer(data);
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCustomer(id);
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        → العملاء
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-5">تعديل بيانات العميل</h2>
        <CustomerForm
          defaultValues={{
            name:    customer.name,
            phone:   customer.phone ?? undefined,
            address: customer.address ?? undefined,
            note:    customer.note ?? undefined,
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
            حذف العميل
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-700 text-center mb-3">
              هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                         rounded-xl py-2.5 disabled:opacity-60 transition-colors"
            >
              {deleting ? "جارٍ الحذف..." : "نعم، احذف العميل"}
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
