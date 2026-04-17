import AppShell from "@/components/layout/AppShell";
import InventoryList from "./InventoryList";

export default function InventoryPage() {
  return (
    <AppShell title="المخزون">
      <InventoryList />
    </AppShell>
  );
}
