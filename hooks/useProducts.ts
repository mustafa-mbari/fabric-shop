"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductCreate, ProductUpdate } from "@/lib/validation/product";

export type ProductRow = {
  id: string;
  name: string;
  type: "METER" | "UNIT";
  product_type: string | null;
  quantity: number;
  color: string | null;
  price: number | null;
  description: string | null;
  created_at: string;
};

export interface ProductFilters {
  search?: string;
  type?: "METER" | "UNIT";
  productType?: string;
  color?: string;
}

async function fetchProducts(filters: ProductFilters): Promise<ProductRow[]> {
  const params = new URLSearchParams();
  if (filters.search?.trim())      params.set("search",       filters.search.trim());
  if (filters.type)                params.set("type",         filters.type);
  if (filters.productType?.trim()) params.set("product_type", filters.productType.trim());
  if (filters.color?.trim())       params.set("color",        filters.color.trim());
  const url = params.size ? `/api/products?${params}` : "/api/products";
  const res = await fetch(url);
  if (!res.ok) throw new Error("فشل تحميل المنتجات");
  const json = await res.json();
  return json.data as ProductRow[];
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters.search ?? "", filters.type ?? "", filters.productType ?? "", filters.color ?? ""],
    queryFn: () => fetchProducts(filters),
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
