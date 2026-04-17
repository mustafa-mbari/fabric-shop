import AppShell from "@/components/layout/AppShell";
import NewOrderForm from "./NewOrderForm";

export default function NewOrderPage() {
  return (
    <AppShell title="طلب جديد">
      <NewOrderForm />
    </AppShell>
  );
}
