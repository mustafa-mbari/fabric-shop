import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import "@/lib/pdf/fonts";
import OrderPDF, { type OrderForPDF } from "@/lib/pdf/OrderPDF";

type OrderRow = OrderForPDF & {
  id: string;
  customer_id: string | null;
  deleted_at: string | null;
};

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرف الطلب مطلوب" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const raw = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  const result = raw as unknown as { data: OrderRow | null; error: unknown };
  if (!result.data)
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  let buf: Buffer;
  try {
    buf = await renderToBuffer(<OrderPDF order={result.data} />);
  } catch (err) {
    console.error("[PDF] renderToBuffer failed:", err);
    return NextResponse.json({ error: "فشل إنشاء الملف" }, { status: 500 });
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="order-${id.slice(0, 8)}.pdf"`,
    },
  });
}
