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
        <div className="flex-1 flex flex-col min-h-screen relative min-w-0 overflow-x-hidden">
          {/* Mobile-only top bar with sidebar trigger */}
          <div className="md:hidden sticky top-0 z-40 flex items-center h-12 px-3 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(41,26,48,0.85), rgba(91,3,41,0.85))" }}>
            <SidebarTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all -ml-1">
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
