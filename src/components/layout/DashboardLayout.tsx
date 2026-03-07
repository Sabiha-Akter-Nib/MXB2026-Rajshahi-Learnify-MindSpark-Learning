import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full"
        style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative">
          {/* Floating sidebar trigger */}
          <div className="fixed top-4 left-4 z-50 md:top-5 md:left-5">
            <SidebarTrigger className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors">
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
