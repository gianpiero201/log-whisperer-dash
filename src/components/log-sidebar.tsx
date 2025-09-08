import { Activity, AlertTriangle, Database, BarChart3, Settings, Search } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Logs", url: "/logs", icon: Database },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Analytics", url: "/analytics", icon: Activity },
  { title: "Search", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function LogSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/20 text-primary border-r-2 border-primary" 
      : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          {state !== "collapsed" && (
            <div>
              <h2 className="text-lg font-semibold">LogDash</h2>
              <p className="text-xs text-muted-foreground">v2.1.0</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClasses}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state !== "collapsed" && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Logs</span>
                  <span className="text-success font-mono">—</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Errors</span>
                  <span className="text-error font-mono">—</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Warnings</span>
                  <span className="text-warning font-mono">—</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-1.5 mt-2">
                  <div className="bg-gradient-primary h-1.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground text-center">System Health: —</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {state === "collapsed" && (
        <div className="absolute top-4 right-2">
          <SidebarTrigger />
        </div>
      )}
    </Sidebar>
  );
}