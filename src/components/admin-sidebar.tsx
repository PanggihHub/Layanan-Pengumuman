"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Film, 
  ListMusic, 
  Monitor, 
  Settings, 
  AlertTriangle, 
  Globe,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Film, label: "Media Library", href: "/admin/media" },
  { icon: ListMusic, label: "Playlists", href: "/admin/playlists" },
  { icon: Monitor, label: "Screens", href: "/admin/screens" },
];

const settings = [
  { icon: Settings, label: "System Config", href: "/admin/settings" },
  { icon: Globe, label: "Localization", href: "/admin/languages" },
  { icon: AlertTriangle, label: "Emergency", href: "/admin/emergency", className: "text-red-400 hover:text-red-500" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-6 bg-primary">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
            <Monitor className="text-primary w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ScreenSense</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-primary">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Management</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn("text-white/90 hover:bg-white/10", pathname === item.href && "bg-white/20 text-white")}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-white/60">Platform</SidebarGroupLabel>
          <SidebarMenu>
            {settings.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn("text-white/90 hover:bg-white/10", pathname === item.href && "bg-white/20 text-white", item.className)}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-primary border-t border-white/10">
        <Link href="/admin/media" className="w-full">
          <Button className="w-full bg-accent text-primary font-bold hover:bg-accent/90" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Content
          </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
