import AppShell from "@/components/layout/AppShell";
import NewCustomerForm from "./NewCustomerForm";

export default function NewCustomerPage() {
  return (
    <AppShell title="عميل جديد">
      <NewCustomerForm />
    </AppShell>
  );
}
