import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
