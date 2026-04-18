"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DebtCreate, DebtUpdate, DebtAddAmount, PaymentCreate } from "@/lib/validation/debt";

export type DebtRow = {
  id: string;
  customer_id: string;
  type: "WHOLESALE" | "RETAIL";
  amount_total: number;
  amount_paid: number;
  remaining: number;
  note: string | null;
  order_id: string | null;
  created_at: string;
  customers: { name: string; phone: string | null } | null;
};

export type PaymentRow = {
  id: string;
  debt_id: string;
  amount: number;
  note: string | null;
  type: "PAYMENT" | "DEBT_ADDED";
  created_at: string;
};

export function useDebts(type: "WHOLESALE" | "RETAIL", customerId?: string, search?: string) {
  const params = new URLSearchParams({ type });
  if (customerId) params.set("customer_id", customerId);
  if (search?.trim()) params.set("search", search.trim());

  return useQuery({
    queryKey: ["debts", type, customerId ?? "", search ?? ""],
    queryFn: async () => {
      const res = await fetch(`/api/debts?${params}`);
      if (!res.ok) throw new Error("فشل تحميل الديون");
      return (await res.json()).data as DebtRow[];
    },
    staleTime: 30_000,
  });
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: ["debt", id],
    queryFn: async () => {
      const res = await fetch(`/api/debts/${id}`);
      if (!res.ok) throw new Error("فشل تحميل الدين");
      return (await res.json()).data as DebtRow;
    },
    staleTime: 30_000,
  });
}

export function usePayments(debtId: string) {
  return useQuery({
    queryKey: ["payments", debtId],
    queryFn: async () => {
      const res = await fetch(`/api/debts/${debtId}/payments`);
      if (!res.ok) throw new Error("فشل تحميل المدفوعات");
      return (await res.json()).data as PaymentRow[];
    },
    staleTime: 30_000,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DebtCreate) => {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل إنشاء الدين");
      return json.data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useAddPayment(debtId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentCreate) => {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل تسجيل الدفعة");
      return json.data as PaymentRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", debtId] });
      qc.invalidateQueries({ queryKey: ["debt", debtId] });
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useDeletePayment(debtId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/debts/${debtId}/payments?paymentId=${paymentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل حذف الدفعة");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", debtId] });
      qc.invalidateQueries({ queryKey: ["debt", debtId] });
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useAddDebtAmount(debtId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DebtAddAmount) => {
      const res = await fetch(`/api/debts/${debtId}/add-amount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل تحديث الدين");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", debtId] });
      qc.invalidateQueries({ queryKey: ["debt", debtId] });
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useUpdateDebt(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DebtUpdate) => {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل التحديث");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debt", id] });
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
