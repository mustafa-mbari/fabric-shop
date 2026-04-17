import AppShell from "@/components/layout/AppShell";
import DebtsLayoutClient from "./DebtsLayoutClient";

export default function DebtsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="الديون">
      <DebtsLayoutClient>{children}</DebtsLayoutClient>
    </AppShell>
  );
}
