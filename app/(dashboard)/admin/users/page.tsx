import AppShell from "@/components/layout/AppShell";
import AdminUsersList from "./AdminUsersList";

export default function AdminUsersPage() {
  return (
    <AppShell title="إدارة المستخدمين">
      <AdminUsersList />
    </AppShell>
  );
}
