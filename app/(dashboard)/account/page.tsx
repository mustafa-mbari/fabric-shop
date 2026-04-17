import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AccountView from "./AccountView";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const raw = await supabase.from("users").select("*").eq("id", user.id).single();
  const profile = (raw as unknown as { data: UserRow | null }).data;

  if (!profile) redirect("/login");

  return (
    <AppShell title="حسابي">
      <AccountView
        initialName={profile.full_name ?? ""}
        email={user.email ?? ""}
        role={profile.role}
      />
    </AppShell>
  );
}
