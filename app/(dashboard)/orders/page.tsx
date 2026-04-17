import AppShell from "@/components/layout/AppShell";
import OrdersList from "./OrdersList";

export default function OrdersPage() {
  return (
    <AppShell title="الطلبات">
      <OrdersList />
    </AppShell>
  );
}
