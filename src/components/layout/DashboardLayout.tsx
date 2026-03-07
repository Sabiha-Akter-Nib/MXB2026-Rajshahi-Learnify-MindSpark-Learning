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
          {/* Floating sidebar trigger — always visible */}
          <SidebarTrigger 
            className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center 
              bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] 
              text-white/60 hover:text-white hover:bg-white/[0.14] hover:border-white/[0.18]
              shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </SidebarTrigger>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
