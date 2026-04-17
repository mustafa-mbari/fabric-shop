"use client";

import { useState, useRef, useEffect } from "react";
import { useCustomers, useCreateCustomer, type CustomerRow } from "@/hooks/useCustomers";
import { customerCreateSchema, type CustomerCreate } from "@/lib/validation/customer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
  value: CustomerRow | null;
  onChange: (customer: CustomerRow | null) => void;
  error?: string;
}

export default function CustomerPicker({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [createError, setCreateError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data: customers, isLoading } = useCustomers(search);
  const { mutateAsync: createCustomer, isPending: creating } = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CustomerCreate>({ resolver: zodResolver(customerCreateSchema) });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setMode("pick");
      setCreateError(null);
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  async function handleCreate(data: CustomerCreate) {
    setCreateError(null);
    try {
      const created = await createCustomer(data);
      onChange(created);
      setOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "فشل إنشاء العميل");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full rounded-xl border px-4 py-3 text-start text-sm transition-colors
          ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white"}
          focus:outline-none focus:ring-2 focus:ring-brand-500`}
      >
        {value ? (
          <span className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{value.name}</span>
            <span className="text-gray-400 text-xs" dir="ltr">{value.phone}</span>
          </span>
        ) : (
          <span className="text-gray-400">اختر عميلاً...</span>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center"
             onClick={(e) => { if (e.target === overlayRef.current) setOpen(false); }}>
          <div ref={overlayRef} className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative bg-white w-full md:w-[480px] md:rounded-2xl rounded-t-2xl
                          max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {mode === "pick" ? "اختر عميلاً" : "عميل جديد"}
              </h3>
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">✕</button>
            </div>

            {mode === "pick" && (
              <>
                {/* Search */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <input
                    autoFocus
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الهاتف..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Customer list */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!isLoading && customers?.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">لا توجد نتائج</p>
                  )}
                  {customers?.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onChange(c); setOpen(false); }}
                      className="w-full text-start px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{c.phone}</p>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    className="w-full text-sm text-brand-600 font-medium py-2 hover:underline"
                  >
                    + إضافة عميل جديد
                  </button>
                </div>
              </>
            )}

            {mode === "create" && (
              <form onSubmit={handleSubmit(handleCreate)} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name")}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    placeholder="اسم العميل"
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-start
                               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    placeholder="07XXXXXXXXX"
                  />
                  {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
                  <input
                    {...register("address")}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    placeholder="اختياري"
                  />
                </div>

                {createError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{createError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("pick")}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                  >
                    {creating ? "..." : "إضافة"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
