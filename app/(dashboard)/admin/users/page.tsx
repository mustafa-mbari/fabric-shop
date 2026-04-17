import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AdminUsersList from "./AdminUsersList";
import { getRole } from "@/lib/auth/requireRole";

export default async function AdminUsersPage() {
  const role = await getRole();
  if (role !== "manager" && role !== "super_admin") redirect("/");

  return (
    <AppShell title="إدارة المستخدمين">
      <AdminUsersList />
    </AppShell>
  );
}
