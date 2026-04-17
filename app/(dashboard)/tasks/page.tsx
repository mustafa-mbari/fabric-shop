import AppShell from "@/components/layout/AppShell";
import TasksView from "./TasksView";

export default function TasksPage() {
  return (
    <AppShell title="المهام">
      <TasksView />
    </AppShell>
  );
}
