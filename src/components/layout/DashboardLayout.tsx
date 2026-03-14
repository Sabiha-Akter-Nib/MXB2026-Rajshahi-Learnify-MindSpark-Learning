import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" style={{ background: "#FEFEFE" }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative min-w-0 overflow-x-hidden">
          {/* Mobile-only top bar with sidebar trigger */}
          <div className="md:hidden sticky top-0 z-40 flex items-center h-12 px-3 backdrop-blur-xl"
            style={{ background: "rgba(254,254,254,0.92)", borderBottom: "1px solid rgba(46,44,45,0.06)" }}>
            <SidebarTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2E2C2D]/60 hover:text-[#2E2C2D] hover:bg-[#2E2C2D]/5 transition-all -ml-1">
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
