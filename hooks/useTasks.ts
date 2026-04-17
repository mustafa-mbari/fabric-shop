"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskCreate, TaskUpdate } from "@/lib/validation/task";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  done: boolean;
  created_at: string;
  users_assigned: { full_name: string | null } | null;
  users_created:  { full_name: string | null } | null;
};

export type UserOption = { id: string; full_name: string | null; role: string };

export function useTasks(filter: "all" | "pending" | "done" = "all") {
  const qs = filter === "pending" ? "?done=false" : filter === "done" ? "?done=true" : "";
  return useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      const res = await fetch(`/api/tasks${qs}`);
      if (!res.ok) throw new Error("فشل تحميل المهام");
      return (await res.json()).data as TaskRow[];
    },
    staleTime: 30_000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("فشل تحميل المستخدمين");
      return (await res.json()).data as UserOption[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskCreate) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل إنشاء المهمة");
      return json.data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: TaskUpdate & { id: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل التحديث");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
