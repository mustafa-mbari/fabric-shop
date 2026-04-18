import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import "@/lib/pdf/fonts";
import DebtsPDF, { type CustomerForPDF, type DebtForPDF } from "@/lib/pdf/DebtsPDF";

type CustomerRow = CustomerForPDF & {
  id: string;
  address: string | null;
  created_at: string;
  deleted_at: string | null;
};

type DebtRow = DebtForPDF & {
  id: string;
  customer_id: string;
  note: string | null;
  order_id: string | null;
  created_by: string;
  deleted_at: string | null;
};

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customer_id");
  if (!customerId)
    return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const rawCustomer = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .is("deleted_at", null)
    .single();
  const customerResult = rawCustomer as unknown as {
    data: CustomerRow | null;
    error: unknown;
  };
  if (!customerResult.data)
    return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

  const rawDebts = await supabase
    .from("debts")
    .select("*")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const debtsResult = rawDebts as unknown as { data: DebtRow[] | null; error: unknown };

  let buf: Buffer;
  try {
    buf = await renderToBuffer(
      <DebtsPDF
        customer={customerResult.data}
        debts={debtsResult.data ?? []}
      />
    );
  } catch (err) {
    console.error("[PDF] renderToBuffer failed:", err);
    return NextResponse.json({ error: "فشل إنشاء الملف" }, { status: 500 });
  }

  const safeName = customerResult.data.name.replace(/\s+/g, "-").slice(0, 20);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="debts-${safeName}.pdf"`,
    },
  });
}
