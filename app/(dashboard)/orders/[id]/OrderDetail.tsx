"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOrder, useUpdateOrder, useDeleteOrder, statusLabel } from "@/hooks/useOrders";
import { useRole } from "@/hooks/useRole";
import { formatMoney } from "@/lib/utils/money";
import type { OrderCreate } from "@/lib/validation/order";
import type { CustomerRow } from "@/hooks/useCustomers";
import OrderForm from "@/components/forms/OrderForm";

const STATUS_LIST = ["NEW", "IN_PROGRESS", "ON_HOLD", "READY", "DELIVERED"] as const;

export default function OrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id);
  const { mutateAsync: updateOrder } = useUpdateOrder(id);
  const { mutateAsync: deleteOrder } = useDeleteOrder();
  const { isManager } = useRole();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  async function handleStatusChange(status: OrderCreate["status"]) {
    setStatusLoading(true);
    try {
      await updateOrder({ status });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleEdit(data: OrderCreate) {
    setError(null);
    setSaving(true);
    try {
      await updateOrder(data);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteOrder(id);
      router.push("/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading || !order) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const badge = statusLabel[order.status];

  if (mode === "edit") {
    const customer: CustomerRow | null = order.customer_id
      ? { id: order.customer_id, name: order.customer_name ?? "", phone: "", address: null, created_at: "" }
      : null;

    return (
      <div className="max-w-xl">
        <button onClick={() => setMode("view")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
          → تفاصيل الطلب
        </button>
        <OrderForm
          defaultValues={{
            customer_id:    order.customer_id,
            customer_name:  order.customer_name ?? "",
            status:         order.status,
            notes:          order.notes ?? "",
            delivery_date:  order.delivery_date ?? "",
            items:          order.order_items?.map((i) => ({
              product_name:   i.product_name,
              quantity:       i.quantity,
              price_per_unit: i.price_per_unit,
            })) ?? [],
            customer: customer,
          }}
          onSubmit={handleEdit}
          submitLabel="حفظ التعديلات"
          loading={saving}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">
          → الطلبات
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {order.customer_name ?? "عميل غير محدد"}
            </p>
            {order.delivery_date && (
              <p className="text-sm text-gray-500 mt-0.5">
                تسليم: {new Date(order.delivery_date).toLocaleDateString("ar-IQ", { day: "numeric", month: "long" })}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${badge.className}`}>
            {badge.text}
          </span>
        </div>

        {/* Status stepper */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_LIST.map((s) => {
            const b = statusLabel[s];
            const isActive = order.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={statusLoading || isActive}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${isActive ? b.className + " ring-2 ring-offset-1 ring-current" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}
                  disabled:cursor-not-allowed`}
              >
                {b.text}
              </button>
            );
          })}
        </div>

        {order.notes && (
          <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
            {order.notes}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">المنتجات</h3>
        <div className="space-y-3">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.quantity} × {formatMoney(item.price_per_unit)}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-800 shrink-0">{formatMoney(item.total_price)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">الإجمالي</span>
          <span className="text-xl font-bold text-gray-900">{formatMoney(order.total_price)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setMode("edit")}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          تعديل الطلب
        </button>
        <a
          href={`/api/export/orders?id=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </a>
        {isManager && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            حذف
          </button>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3">
          <p className="text-sm text-red-700 text-center">هل أنت متأكد من حذف هذا الطلب؟</p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full bg-red-600 text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-60"
          >
            {deleting ? "جارٍ الحذف..." : "نعم، احذف الطلب"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5"
          >
            إلغاء
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
