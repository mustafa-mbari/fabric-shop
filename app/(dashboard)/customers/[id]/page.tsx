import AppShell from "@/components/layout/AppShell";
import CustomerDetail from "./CustomerDetail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="تفاصيل العميل">
      <CustomerDetail id={id} />
    </AppShell>
  );
}
