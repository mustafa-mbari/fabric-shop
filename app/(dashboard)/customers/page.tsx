import AppShell from "@/components/layout/AppShell";
import CustomersList from "./CustomersList";

export default function CustomersPage() {
  return (
    <AppShell title="العملاء">
      <CustomersList />
    </AppShell>
  );
}
