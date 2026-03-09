import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full"
        style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative">
          {/* Mobile sidebar trigger */}
          <div className="md:hidden fixed top-3 left-3 z-50">
            <SidebarTrigger className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/15 flex items-center justify-center">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
