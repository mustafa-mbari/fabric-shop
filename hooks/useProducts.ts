"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductCreate, ProductUpdate } from "@/lib/validation/product";

export type ProductRow = {
  id: string;
  name: string;
  type: "METER" | "UNIT";
  quantity: number;
  color: string | null;
  price: number | null;
  description: string | null;
  created_at: string;
};

async function fetchProducts(search?: string, type?: "METER" | "UNIT"): Promise<ProductRow[]> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (type)           params.set("type", type);
  const url = params.size ? `/api/products?${params}` : "/api/products";
  const res = await fetch(url);
  if (!res.ok) throw new Error("فشل تحميل المنتجات");
  const json = await res.json();
  return json.data as ProductRow[];
}

export function useProducts(search?: string, type?: "METER" | "UNIT") {
  return useQuery({
    queryKey: ["products", search ?? "", type ?? ""],
    queryFn: () => fetchProducts(search, type),
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل إنشاء المنتج");
      return json.data as ProductRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductUpdate) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل التحديث");
      return json.data as ProductRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
