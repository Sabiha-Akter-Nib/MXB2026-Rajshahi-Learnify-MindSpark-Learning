import { 
  Bot, 
  Dumbbell, 
  ClipboardCheck, 
  BookOpenCheck, 
  Trophy, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  BookOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r-0"
      style={{
        // Override sidebar CSS vars for our dark theme
        "--sidebar-background": "rgba(25, 15, 35, 0.95)",
        "--sidebar-foreground": "rgba(255, 255, 255, 0.85)",
        "--sidebar-accent": "rgba(255, 255, 255, 0.08)",
        "--sidebar-accent-foreground": "rgba(255, 255, 255, 0.95)",
        "--sidebar-border": "rgba(255, 255, 255, 0.06)",
      } as React.CSSProperties}
    >
      <SidebarContent className="pt-4 gap-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-[10px] uppercase tracking-wider font-medium">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-white/5 rounded-lg transition-colors"
                      activeClassName="bg-white/10 text-white font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-[10px] uppercase tracking-wider font-medium">
            {!collapsed && "Insights"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-white/5 rounded-lg transition-colors"
                      activeClassName="bg-white/10 text-white font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-white/5 rounded-lg transition-colors"
                        activeClassName="bg-white/10 text-white font-medium"
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
