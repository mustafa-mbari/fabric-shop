import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Belt-and-suspenders: middleware already redirects, but this guards against edge cases.
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
