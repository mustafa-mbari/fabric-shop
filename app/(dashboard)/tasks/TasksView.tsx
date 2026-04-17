"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTasks, useUsers, useCreateTask, useUpdateTask, useDeleteTask, type TaskRow } from "@/hooks/useTasks";
import { useRole } from "@/hooks/useRole";
import { taskCreateSchema, type TaskCreate } from "@/lib/validation/task";

const FILTERS = [
  { value: "all",     label: "الكل" },
  { value: "pending", label: "قيد التنفيذ" },
  { value: "done",    label: "مكتملة" },
] as const;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-IQ", { day: "numeric", month: "short" });
}

function NewTaskForm({ onClose }: { onClose: () => void }) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { data: users } = useUsers();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TaskCreate>({
    resolver: zodResolver(taskCreateSchema),
  });

  async function onSubmit(data: TaskCreate) {
    setError(null);
    try {
      await createTask(data);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full md:w-[440px] md:rounded-2xl rounded-t-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">مهمة جديدة</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="عنوان المهمة"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              الوصف <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                         resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              placeholder="تفاصيل إضافية..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              تكليف إلى <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
            </label>
            <select
              {...register("assigned_to")}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            >
              <option value="">— بدون تكليف —</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-600"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
            >
              {isPending ? "..." : "إضافة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: TaskRow }) {
  const { mutate: updateTask, isPending: toggling } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { isManager } = useRole();

  function toggleDone() {
    updateTask({ id: task.id, done: !task.done });
  }

  return (
    <div className={`bg-white rounded-xl border p-4 transition-opacity ${task.done ? "opacity-60 border-gray-100" : "border-gray-200"}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          disabled={toggling}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                      transition-colors ${task.done
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-brand-400"
                      }`}
          aria-label={task.done ? "علّم كغير مكتملة" : "علّم كمكتملة"}
        >
          {task.done && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${task.done ? "line-through text-gray-400" : "text-gray-900"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {task.users_assigned?.full_name && (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                {task.users_assigned.full_name}
              </span>
            )}
            <span className="text-xs text-gray-400">{formatDate(task.created_at)}</span>
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => deleteTask(task.id)}
            className="shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1"
            aria-label="حذف المهمة"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function TasksView() {
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [showForm, setShowForm] = useState(false);
  const { data: tasks, isLoading, isError } = useTasks(filter);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{tasks?.length ?? 0} مهمة</span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
        >
          <span className="text-lg leading-none">+</span>
          <span>مهمة جديدة</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors
              ${filter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
          تعذّر تحميل المهام.
        </div>
      )}

      {!isLoading && !isError && tasks?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✓</p>
          <p className="text-sm">
            {filter === "done" ? "لا توجد مهام مكتملة" : filter === "pending" ? "لا توجد مهام قيد التنفيذ" : "لا توجد مهام"}
          </p>
          {filter === "all" && (
            <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-brand-600 font-medium hover:underline">
              أضف أول مهمة
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}

      {showForm && <NewTaskForm onClose={() => setShowForm(false)} />}
    </>
  );
}
