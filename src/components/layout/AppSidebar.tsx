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
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import oddhaboshLogo from "@/assets/oddhaboshai-logo.png";
import smallLogo from "@/assets/logo.png";
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
  { title: "Profile", url: "/profile", icon: User },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const renderItem = (item: typeof mainItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink
          to={item.url}
          className={`flex items-center gap-3 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          activeClassName="!bg-gradient-to-r !from-[hsl(270,60%,50%)]/20 !to-[hsl(330,60%,50%)]/10 !text-white !font-semibold"
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
      className="border-r-0 z-50 [&_[data-sidebar=sidebar]]:border-r-0 [&_[data-sidebar=sidebar]]:backdrop-blur-2xl [&_[data-sidebar=sidebar]]:bg-transparent [&[data-mobile=true]]:bg-[#1a0f22] [&_[data-mobile=true]]:bg-[#1a0f22]"
      style={{
        "--sidebar-background": "transparent",
        "--sidebar-foreground": "rgba(255, 255, 255, 0.85)",
        "--sidebar-accent": "rgba(168, 85, 247, 0.12)",
        "--sidebar-accent-foreground": "rgba(255, 255, 255, 0.95)",
        "--sidebar-border": "transparent",
      } as React.CSSProperties}
    >
      {/* Header with OddhaboshAI branding */}
      <SidebarHeader className={collapsed ? "px-1 pt-3 pb-2" : "px-3 pt-5 pb-3"}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <img 
              src={oddhaboshLogo} 
              alt="OddhaboshAI" 
              className="max-h-20 w-auto max-w-[80%] object-contain" 
            />
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img 
              src={smallLogo} 
              alt="OddhaboshAI" 
              className="w-8 h-8 object-contain" 
            />
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* Subtle divider */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <SidebarContent className="px-2 pt-3 gap-1">
        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/25 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 mb-1">
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
          <SidebarGroupLabel className="text-white/25 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 mb-1">
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
        <div className="mx-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />
        <SidebarMenu className="gap-0.5">
          {bottomItems.map(renderItem)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
