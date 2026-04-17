"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderCreate, OrderUpdate } from "@/lib/validation/order";

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
};

export type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  status: "NEW" | "IN_PROGRESS" | "ON_HOLD" | "READY" | "DELIVERED";
  total_price: number;
  notes: string | null;
  delivery_date: string | null;
  created_by: string;
  created_at: string;
  order_items?: OrderItemRow[];
};

export const statusLabel: Record<OrderRow["status"], { text: string; className: string }> = {
  NEW:         { text: "جديد",      className: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { text: "قيد التنفيذ", className: "bg-blue-100 text-blue-700" },
  ON_HOLD:     { text: "معلّق",     className: "bg-yellow-100 text-yellow-700" },
  READY:       { text: "جاهز",      className: "bg-green-100 text-green-700" },
  DELIVERED:   { text: "مُسلَّم",   className: "bg-purple-100 text-purple-700" },
};

export function useOrders(filters?: { status?: string; customer_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status)      params.set("status", filters.status);
  if (filters?.customer_id) params.set("customer_id", filters.customer_id);
  const qs = params.toString();

  return useQuery({
    queryKey: ["orders", filters ?? {}],
    queryFn: async () => {
      const res = await fetch(`/api/orders${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("فشل تحميل الطلبات");
      const json = await res.json();
      return json.data as OrderRow[];
    },
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("فشل تحميل الطلب");
      const json = await res.json();
      return json.data as OrderRow;
    },
    staleTime: 30_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OrderCreate) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل إنشاء الطلب");
      return json.data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OrderUpdate) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل تحديث الطلب");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
