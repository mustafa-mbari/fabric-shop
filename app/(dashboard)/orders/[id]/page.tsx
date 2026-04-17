import AppShell from "@/components/layout/AppShell";
import OrderDetail from "./OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="تفاصيل الطلب">
      <OrderDetail id={id} />
    </AppShell>
  );
}
