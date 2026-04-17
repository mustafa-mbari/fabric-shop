"use client";

import { useEffect, useState } from "react";

type UserRecord = {
  id: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
};

const statusLabel: Record<string, { text: string; className: string }> = {
  pending:  { text: "بانتظار الموافقة", className: "bg-yellow-100 text-yellow-700" },
  active:   { text: "نشط",             className: "bg-green-100 text-green-700" },
  rejected: { text: "مرفوض",           className: "bg-red-100 text-red-700" },
};

const roleLabel: Record<string, string> = {
  manager: "مدير",
  worker:  "موظف",
};

export default function AdminUsersList() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function updateStatus(userId: string, status: "active" | "rejected") {
    setActionLoading(userId + status);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u)),
      );
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">
          لا يوجد مستخدمون
        </p>
      )}
      {users.map((user) => {
        const badge = statusLabel[user.status] ?? statusLabel["pending"]!;
        return (
          <div
            key={user.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.full_name ?? "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {roleLabel[user.role] ?? user.role}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}
              >
                {badge.text}
              </span>
            </div>

            {user.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateStatus(user.id, "active")}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg py-2.5
                             transition-colors duration-150"
                >
                  {actionLoading === user.id + "active" ? "..." : "قبول"}
                </button>
                <button
                  onClick={() => updateStatus(user.id, "rejected")}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-white hover:bg-red-50 disabled:opacity-50
                             text-red-600 text-sm font-medium rounded-lg py-2.5
                             border border-red-200 transition-colors duration-150"
                >
                  {actionLoading === user.id + "rejected" ? "..." : "رفض"}
                </button>
              </div>
            )}

            {user.status === "active" && (
              <button
                onClick={() => updateStatus(user.id, "rejected")}
                disabled={actionLoading !== null}
                className="mt-3 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                إلغاء الصلاحية
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
