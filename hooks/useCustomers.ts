"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomerCreate, CustomerUpdate } from "@/lib/validation/customer";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
};

async function fetchCustomers(search?: string): Promise<CustomerRow[]> {
  const url = search?.trim()
    ? `/api/customers?search=${encodeURIComponent(search)}`
    : "/api/customers";
  const res = await fetch(url);
  if (!res.ok) throw new Error("فشل تحميل العملاء");
  const json = await res.json();
  return json.data as CustomerRow[];
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search ?? ""],
    queryFn: () => fetchCustomers(search),
    staleTime: 30_000,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CustomerCreate) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل إنشاء العميل");
      return json.data as CustomerRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CustomerUpdate) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل التحديث");
      return json.data as CustomerRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
