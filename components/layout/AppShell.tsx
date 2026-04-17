import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import TopBar from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={title} />
        {/* pb-20 gives clearance above the fixed BottomNav on mobile */}
        <main className="flex-1 px-4 py-5 md:px-6 pb-20 md:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
