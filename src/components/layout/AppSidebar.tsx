import { 
  Bot, 
  Dumbbell, 
  ClipboardCheck, 
  BookOpenCheck, 
  Trophy, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  BookOpen,
  Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Tutor", url: "/tutor", icon: Bot },
  { title: "Practice", url: "/practice", icon: Dumbbell },
  { title: "Assessment", url: "/assessment", icon: ClipboardCheck },
  { title: "Learning Plan", url: "/learning-plan", icon: BookOpenCheck },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

const insightItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderItem = (item: typeof mainItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink
          to={item.url}
          end
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          activeClassName="!bg-gradient-to-r !from-purple-500/20 !to-pink-500/15 !text-white !font-semibold !border !border-white/10 !shadow-[0_0_20px_rgba(168,85,247,0.15)]"
        >
          <item.icon className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-sm">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r-0 z-50"
      style={{
        "--sidebar-background": "rgba(18, 10, 28, 0.98)",
        "--sidebar-foreground": "rgba(255, 255, 255, 0.85)",
        "--sidebar-accent": "rgba(168, 85, 247, 0.12)",
        "--sidebar-accent-foreground": "rgba(255, 255, 255, 0.95)",
        "--sidebar-border": "rgba(255, 255, 255, 0.04)",
      } as React.CSSProperties}
    >
      {/* Header with logo */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="MindSpark" className="w-8 h-8 object-contain" />
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-base tracking-tight">MindSpark</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 gap-1">
        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/30 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 mb-1">
            {!collapsed ? "Main" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Insights */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/30 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 mb-1">
            {!collapsed ? "Insights" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {insightItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with settings */}
      <SidebarFooter className="px-2 pb-4">
        <div className="border-t border-white/[0.06] pt-3">
          <SidebarMenu className="gap-0.5">
            {bottomItems.map(renderItem)}
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
