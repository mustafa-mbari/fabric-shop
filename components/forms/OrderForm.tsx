"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderCreateSchema, type OrderCreate, type OrderItem } from "@/lib/validation/order";
import CustomerPicker from "./CustomerPicker";
import { formatMoney } from "@/lib/utils/money";
import type { CustomerRow } from "@/hooks/useCustomers";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";

const STATUS_OPTIONS = [
  { value: "NEW",         label: "جديد" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "ON_HOLD",     label: "معلّق" },
  { value: "READY",       label: "جاهز" },
  { value: "DELIVERED",   label: "مُسلَّم" },
];

interface Props {
  defaultValues?: Partial<OrderCreate> & { customer?: CustomerRow | null };
  onSubmit: (data: OrderCreate) => Promise<void>;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}

const emptyItem: OrderItem = { product_name: "", quantity: 1, price_per_unit: 0 };

export default function OrderForm({ defaultValues, onSubmit, submitLabel, loading, error }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    defaultValues?.customer ?? null,
  );
  const [noCustomer, setNoCustomer] = useState(!defaultValues?.customer_id);
  const { data: products } = useProducts();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderCreate>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      status: "NEW",
      items: [emptyItem],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const runningTotal = (items ?? []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price_per_unit) || 0;
    return sum + Math.floor(qty * price);
  }, 0);

  function handleCustomerChange(c: CustomerRow | null) {
    setSelectedCustomer(c);
    setValue("customer_id", c?.id ?? null);
    setValue("customer_name", c?.name ?? "");
  }

  function handleProductSelect(index: number, productName: string) {
    setValue(`items.${index}.product_name`, productName);
  }

  async function handleFormSubmit(data: OrderCreate) {
    if (selectedCustomer) {
      data.customer_id = selectedCustomer.id;
      data.customer_name = selectedCustomer.name;
    } else {
      data.customer_id = null;
    }
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>

      {/* Customer */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">العميل</h3>

        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => { setNoCustomer(false); }}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors
              ${!noCustomer ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            من قائمة العملاء
          </button>
          <button
            type="button"
            onClick={() => { setNoCustomer(true); setSelectedCustomer(null); setValue("customer_id", null); }}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors
              ${noCustomer ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            اسم مباشر
          </button>
        </div>

        {noCustomer ? (
          <div>
            <input
              {...register("customer_name")}
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="اسم العميل"
            />
            {errors.customer_name && (
              <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
            )}
          </div>
        ) : (
          <CustomerPicker
            value={selectedCustomer}
            onChange={handleCustomerChange}
            error={errors.customer_name?.message ?? errors.customer_id?.message}
          />
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">المنتجات</h3>
          <span className="text-xs text-gray-400">أسماء المنتجات من المخزون أو أدخل اسماً جديداً</span>
        </div>

        <div className="space-y-4">
          {fields.map((field, i) => (
            <div key={field.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">منتج {i + 1}</p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    حذف
                  </button>
                )}
              </div>

              {/* Product name with suggestions */}
              <div className="mb-3">
                <input
                  {...register(`items.${i}.product_name`)}
                  list={`products-list-${i}`}
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="اسم المنتج"
                  onChange={(e) => handleProductSelect(i, e.target.value)}
                />
                <datalist id={`products-list-${i}`}>
                  {products?.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                {errors.items?.[i]?.product_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.items[i]?.product_name?.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الكمية</label>
                  <input
                    {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step={0.25}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.items?.[i]?.quantity && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[i]?.quantity?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">السعر / وحدة (د.ع)</label>
                  <input
                    {...register(`items.${i}.price_per_unit`, { valueAsNumber: true })}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={250}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.items?.[i]?.price_per_unit && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[i]?.price_per_unit?.message}</p>
                  )}
                </div>
              </div>

              {/* Row subtotal */}
              {(Number(items[i]?.quantity) > 0 && Number(items[i]?.price_per_unit) > 0) && (
                <p className="text-end text-xs text-gray-500 mt-2">
                  {formatMoney(Math.floor(Number(items[i]?.quantity) * Number(items[i]?.price_per_unit)))}
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.items?.root && (
          <p className="mt-2 text-xs text-red-600">{errors.items.root.message}</p>
        )}
        {typeof errors.items?.message === "string" && (
          <p className="mt-2 text-xs text-red-600">{errors.items.message}</p>
        )}

        <button
          type="button"
          onClick={() => append(emptyItem)}
          className="mt-4 w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm
                     text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          + إضافة منتج
        </button>

        {/* Running total */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">الإجمالي المتوقع</span>
          <span className="text-lg font-bold text-gray-900">{formatMoney(runningTotal)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">تفاصيل إضافية</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">الحالة</label>
          <select
            {...register("status")}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            تاريخ التسليم <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
          </label>
          <input
            {...register("delivery_date")}
            type="date"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ملاحظات <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                       resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            placeholder="أي ملاحظات للطلب..."
          />
        </div>
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
        {loading ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </form>
  );
}
