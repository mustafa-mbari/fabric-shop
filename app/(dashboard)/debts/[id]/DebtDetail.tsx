"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebt, usePayments, useAddPayment, useDeletePayment, useDeleteDebt, useAddDebtAmount } from "@/hooks/useDebts";
import { useRole } from "@/hooks/useRole";
import { formatMoney } from "@/lib/utils/money";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentCreateSchema, debtAddAmountSchema, type PaymentCreate, type DebtAddAmount } from "@/lib/validation/debt";

const typeLabel: Record<string, string> = { WHOLESALE: "بالجملة", RETAIL: "بالمفرد" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-IQ", { day: "numeric", month: "long", year: "numeric" });
}

function AddPaymentSheet({
  debtId,
  maxAmount,
  onClose,
}: {
  debtId: string;
  maxAmount: number;
  onClose: () => void;
}) {
  const { mutateAsync: addPayment, isPending } = useAddPayment(debtId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentCreate>({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: { amount: maxAmount },
  });

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function onSubmit(data: PaymentCreate) {
    setServerError(null);
    try {
      await addPayment(data);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "فشل تسجيل الدفعة");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center" role="dialog" aria-modal="true" aria-label="تسجيل دفعة">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full md:w-[420px] md:rounded-2xl rounded-t-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">تسجيل دفعة</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              المبلغ (د.ع) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              min={250}
              max={maxAmount}
              step={250}
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="مثال: 25000"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ملاحظة <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
            </label>
            <input
              {...register("note")}
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="..."
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-3 text-base font-semibold text-white
                       min-h-[48px] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            {isPending ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddAmountSheet({
  debtId,
  onClose,
}: {
  debtId: string;
  onClose: () => void;
}) {
  const { mutateAsync: addAmount, isPending } = useAddDebtAmount(debtId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DebtAddAmount>({
    resolver: zodResolver(debtAddAmountSchema),
  });

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function onSubmit(data: DebtAddAmount) {
    setServerError(null);
    try {
      await addAmount(data);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "فشل تحديث الدين");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center" role="dialog" aria-modal="true" aria-label="إضافة مبلغ للدين">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full md:w-[420px] md:rounded-2xl rounded-t-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">إضافة مبلغ للدين</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              المبلغ الإضافي (د.ع) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              min={250}
              step={250}
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="مثال: 25000"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ملاحظة <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
            </label>
            <input
              {...register("note")}
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="..."
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-3 text-base font-semibold text-white
                       min-h-[48px] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            {isPending ? "جارٍ الحفظ..." : "إضافة للدين"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DebtDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: debt, isLoading } = useDebt(id);
  const { data: payments } = usePayments(id);
  const { mutateAsync: deleteDebt } = useDeleteDebt();
  const { mutateAsync: deletePayment, isPending: deletingPayment } = useDeletePayment(id);
  const { isManager } = useRole();

  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showAddAmountSheet, setShowAddAmountSheet] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteDebt() {
    setDeleting(true);
    try {
      await deleteDebt(id);
      router.push("/debts/wholesale");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    try {
      await deletePayment(paymentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حذف الدفعة");
    }
  }

  if (isLoading || !debt) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const backHref = debt.type === "RETAIL" ? "/debts/retail" : "/debts/wholesale";
  const paidPct = debt.amount_total > 0 ? Math.round((debt.amount_paid / debt.amount_total) * 100) : 0;

  return (
    <>
      <div className="max-w-lg space-y-4">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          → الديون ({typeLabel[debt.type]})
        </Link>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">{debt.customers?.name ?? "—"}</p>
              <p className="text-sm text-gray-400 mt-0.5" dir="ltr">{debt.customers?.phone}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {typeLabel[debt.type]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>نسبة السداد</span>
              <span>{paidPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${paidPct}%`,
                  background: paidPct === 100 ? "#16a34a" : "linear-gradient(90deg, #0284c7, #0369a1)",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">الإجمالي</p>
              <p className="text-sm font-bold text-gray-800">{formatMoney(debt.amount_total)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">المدفوع</p>
              <p className="text-sm font-bold text-green-700">{formatMoney(debt.amount_paid)}</p>
            </div>
            <div className={`rounded-xl p-3 ${debt.remaining > 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-xs text-gray-400 mb-1">المتبقي</p>
              <p className={`text-sm font-bold ${debt.remaining > 0 ? "text-red-600" : "text-green-700"}`}>
                {formatMoney(debt.remaining)}
              </p>
            </div>
          </div>

          {debt.note && (
            <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
              {debt.note}
            </p>
          )}
        </div>

        {/* Transactions card — header + action buttons + log */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {/* Card header: title + action buttons */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">سجل الحركات</h3>
            <div className="flex items-center gap-2">
              {debt.remaining > 0 && (
                <button
                  onClick={() => setShowPaymentSheet(true)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                >
                  + تسجيل دفعة
                </button>
              )}
              {isManager && (
                <button
                  onClick={() => setShowAddAmountSheet(true)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  + إضافة دين
                </button>
              )}
              <a
                href={`/api/export/debts?customer_id=${debt.customer_id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="كشف حساب PDF"
                className="rounded-xl border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 flex items-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            </div>
          </div>

          {!payments || payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد حركات بعد</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-green-700">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.created_at)}</p>
                    {p.note && <p className="text-xs text-gray-500 truncate">{p.note}</p>}
                  </div>
                  {isManager && (
                    confirmPaymentId === p.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { handleDeletePayment(p.id); setConfirmPaymentId(null); }}
                          disabled={deletingPayment}
                          className="text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg px-2.5 py-1 disabled:opacity-60"
                        >
                          {deletingPayment ? "..." : "تأكيد"}
                        </button>
                        <button
                          onClick={() => setConfirmPaymentId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPaymentId(p.id)}
                        className="shrink-0 text-xs text-red-400 hover:text-red-600 px-2 py-1"
                      >
                        حذف
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager: delete debt */}
        {isManager && (
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">منطقة الخطر</p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-600 font-medium border border-red-200 rounded-xl
                           px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-center"
              >
                حذف الدين
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 text-center mb-3">هل أنت متأكد؟ سيتم حذف الدين وجميع المدفوعات.</p>
                <button
                  onClick={handleDeleteDebt}
                  disabled={deleting}
                  className="w-full bg-red-600 text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-60"
                >
                  {deleting ? "جارٍ الحذف..." : "نعم، احذف"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>

      {showPaymentSheet && (
        <AddPaymentSheet
          debtId={id}
          maxAmount={debt.remaining}
          onClose={() => setShowPaymentSheet(false)}
        />
      )}
      {showAddAmountSheet && (
        <AddAmountSheet
          debtId={id}
          onClose={() => setShowAddAmountSheet(false)}
        />
      )}
    </>
  );
}
