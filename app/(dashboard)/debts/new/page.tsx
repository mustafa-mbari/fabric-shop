import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import NewDebtForm from "./NewDebtForm";

export default function NewDebtPage() {
  return (
    <AppShell title="دين جديد">
      <Suspense>
        <NewDebtForm />
      </Suspense>
    </AppShell>
  );
}
