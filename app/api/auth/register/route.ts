import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const { fullName, email, password } = parsed.data;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      // status and role are intentionally omitted → trigger defaults to pending/worker
    },
  });

  if (error) {
    const message =
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
        ? "هذا البريد الإلكتروني مسجل مسبقاً"
        : "حدث خطأ أثناء التسجيل، حاول مجدداً";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ userId: data.user.id }, { status: 201 });
}
