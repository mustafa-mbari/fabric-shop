"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  initialName: string;
  email: string;
  role: string;
}

export default function AccountView({ initialName, email, role }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    if (!name.trim()) { setNameError("الاسم مطلوب"); return; }
    setNameLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setNameError(json.error ?? "فشل التحديث");
      } else {
        setNameSuccess(true);
        router.refresh();
      }
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);
    if (newPwd.length < 6) { setPwdError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (newPwd !== confirmPwd) { setPwdError("كلمتا المرور غير متطابقتين"); return; }

    setPwdLoading(true);
    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPwd,
      });
      if (signInErr) { setPwdError("كلمة المرور الحالية غير صحيحة"); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updateErr) { setPwdError("فشل تحديث كلمة المرور"); return; }

      setPwdSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold shrink-0">
            {name.trim()[0]?.toUpperCase() ?? "؟"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{initialName}</p>
            <p className="text-sm text-gray-500 truncate">{email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {role === "super_admin" ? "مدير عام" : role === "manager" ? "مدير" : "موظف"}
            </span>
          </div>
        </div>

        {/* Edit name */}
        <form onSubmit={handleNameSave} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">الاسم الكامل</span>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSuccess(false); }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </label>
          {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          {nameSuccess && <p className="text-xs text-green-600">تم تحديث الاسم بنجاح</p>}
          <button
            type="submit"
            disabled={nameLoading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            {nameLoading ? "جاري الحفظ..." : "حفظ الاسم"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">تغيير كلمة المرور</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">كلمة المرور الحالية</span>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">كلمة المرور الجديدة</span>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">تأكيد كلمة المرور</span>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </label>
          {pwdError && <p className="text-xs text-red-600">{pwdError}</p>}
          {pwdSuccess && <p className="text-xs text-green-600">تم تغيير كلمة المرور بنجاح</p>}
          <button
            type="submit"
            disabled={pwdLoading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {pwdLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-2xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
