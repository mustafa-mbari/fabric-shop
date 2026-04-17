"use client";

import { useState, useEffect, useRef } from "react";

export type ActionItem = {
  label: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
  requireConfirm?: boolean;
};

export default function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dangerItem = items.find((i) => i.danger && i.requireConfirm);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
    setConfirming(false);
  }

  function handleItemClick(item: ActionItem) {
    if (item.danger && item.requireConfirm) {
      setConfirming(true);
    } else {
      item.onClick();
      setOpen(false);
    }
  }

  async function handleConfirm() {
    if (!dangerItem) return;
    setLoading(true);
    try {
      await dangerItem.onClick();
    } finally {
      setLoading(false);
      setOpen(false);
      setConfirming(false);
    }
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={toggle}
        aria-label="خيارات"
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100
                   transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full end-0 z-30 mt-1 bg-white rounded-xl border border-gray-200
                        shadow-lg min-w-[140px] overflow-hidden">
          {confirming ? (
            <div className="p-3 space-y-2">
              <p className="text-xs text-red-700 font-medium text-center">تأكيد الحذف؟</p>
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={handleConfirm}
                  className="flex-1 text-xs bg-red-600 text-white rounded-lg py-1.5 font-medium disabled:opacity-60"
                >
                  {loading ? "..." : "حذف"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 text-xs border border-gray-200 text-gray-600 rounded-lg py-1.5"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-start px-4 py-2.5 text-sm transition-colors
                    ${item.danger
                      ? "text-red-600 hover:bg-red-50"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
