"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerCreateSchema, type CustomerCreate } from "@/lib/validation/customer";

interface Props {
  defaultValues?: Partial<CustomerCreate>;
  onSubmit: (data: CustomerCreate) => Promise<void>;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}

export default function CustomerForm({ defaultValues, onSubmit, submitLabel, loading, error }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerCreate>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          الاسم <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
          placeholder="اسم العميل"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          رقم الهاتف <span className="text-red-500">*</span>
        </label>
        <input
          {...register("phone")}
          type="tel"
          inputMode="tel"
          dir="ltr"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors text-start"
          placeholder="07XXXXXXXXX"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          العنوان <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
        </label>
        <input
          {...register("address")}
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
          placeholder="المدينة / الحي"
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ملاحظة <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
        </label>
        <textarea
          {...register("note")}
          rows={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
          placeholder="ملاحظات خاصة بالعميل..."
        />
        {errors.note && (
          <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>
        )}
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
                   min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
      >
        {loading ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </form>
  );
}
