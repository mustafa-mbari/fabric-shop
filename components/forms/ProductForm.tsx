"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, type ProductCreate } from "@/lib/validation/product";

const typeLabel: Record<string, string> = { METER: "متر", UNIT: "وحدة" };

interface Props {
  defaultValues?: Partial<ProductCreate>;
  onSubmit: (data: ProductCreate) => Promise<void>;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}

export default function ProductForm({ defaultValues, onSubmit, submitLabel, loading, error }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductCreate>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: { type: "METER", quantity: 0, ...defaultValues },
  });

  const selectedType = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          اسم المنتج <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
          placeholder="مثال: قماش قطن"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع القياس <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(["METER", "UNIT"] as const).map((t) => (
            <label
              key={t}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 cursor-pointer
                          transition-colors text-sm font-medium
                          ${selectedType === t
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
            >
              <input {...register("type")} type="radio" value={t} className="sr-only" />
              <span>{typeLabel[t]}</span>
            </label>
          ))}
        </div>
        {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            اللون <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
          </label>
          <input
            {...register("color")}
            type="text"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                       text-gray-900 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                       focus:bg-white transition-colors"
            placeholder="مثال: أحمر"
          />
          {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            السعر (د.ع) <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
          </label>
          <input
            {...register("price", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            min={0}
            step={250}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                       text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                       focus:bg-white transition-colors"
            placeholder="0"
          />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          الكمية الحالية <span className="text-red-500">*</span>
        </label>
        <input
          {...register("quantity", { valueAsNumber: true })}
          type="number"
          inputMode="decimal"
          min={0}
          step={selectedType === "METER" ? "0.25" : "1"}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
        />
        {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          وصف <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
        </label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                     text-gray-900 placeholder:text-gray-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     focus:bg-white transition-colors"
          placeholder="ملاحظات إضافية..."
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
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
