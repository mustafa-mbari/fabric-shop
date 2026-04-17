"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtCreateSchema, type DebtCreate } from "@/lib/validation/debt";
import CustomerPicker from "./CustomerPicker";
import type { CustomerRow } from "@/hooks/useCustomers";
import { useState } from "react";

interface Props {
  defaultType?: "WHOLESALE" | "RETAIL";
  onSubmit: (data: DebtCreate) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const typeOptions = [
  { value: "WHOLESALE", label: "بالجملة" },
  { value: "RETAIL",    label: "بالمفرد" },
];

export default function DebtForm({ defaultType = "WHOLESALE", onSubmit, loading, error }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DebtCreate>({
    resolver: zodResolver(debtCreateSchema),
    defaultValues: { type: defaultType, order_id: null },
  });

  const selectedType = watch("type");

  function handleCustomerChange(c: CustomerRow | null) {
    setSelectedCustomer(c);
    setValue("customer_id", c?.id ?? "");
  }

  async function handleFormSubmit(data: DebtCreate) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>

      {/* Customer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          العميل <span className="text-red-500">*</span>
        </label>
        <CustomerPicker
          value={selectedCustomer}
          onChange={handleCustomerChange}
          error={errors.customer_id?.message}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع الدين <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {typeOptions.map((t) => (
            <label
              key={t.value}
              className={`flex-1 flex items-center justify-center rounded-xl border py-3 cursor-pointer
                          text-sm font-medium transition-colors
                          ${selectedType === t.value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
            >
              <input {...register("type")} type="radio" value={t.value} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          المبلغ الإجمالي (د.ع) <span className="text-red-500">*</span>
        </label>
        <input
          {...register("amount_total", { valueAsNumber: true })}
          type="number"
          inputMode="numeric"
          min={250}
          step={250}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500
                     focus:border-transparent focus:bg-white transition-colors"
          placeholder="مثال: 50000"
        />
        {errors.amount_total && (
          <p className="mt-1 text-xs text-red-600">{errors.amount_total.message}</p>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ملاحظة <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
        </label>
        <textarea
          {...register("note")}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-sm text-gray-900 resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500
                     focus:border-transparent focus:bg-white transition-colors"
          placeholder="تفاصيل إضافية..."
        />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 shrink-0">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-base font-semibold text-white
                   min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
      >
        {loading ? "جارٍ الحفظ..." : "تسجيل الدين"}
      </button>
    </form>
  );
}
