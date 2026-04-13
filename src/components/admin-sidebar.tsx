
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
  Plus,
  Heart,
  Home,
  ExternalLink,
  ChevronUp,
  Shield,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/lib/translations";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems: { icon: any, labelKey: TranslationKey, href: string }[] = [
  { icon: LayoutDashboard, labelKey: "nav.overview", href: "/admin" },
  { icon: Film, labelKey: "nav.media", href: "/admin/media" },
  { icon: ListMusic, labelKey: "nav.playlists", href: "/admin/playlists" },
  { icon: Monitor, labelKey: "nav.screens", href: "/admin/screens" },
  { icon: Heart, labelKey: "nav.worship", href: "/admin/worship" },
];

const settings: { icon: any, labelKey: TranslationKey, href: string, className?: string }[] = [
  { icon: Settings, labelKey: "nav.settings", href: "/admin/settings" },
  { icon: Shield, labelKey: "nav.security", href: "/admin/security" },
  { icon: Globe, labelKey: "nav.localization", href: "/admin/languages" },
  { icon: AlertTriangle, labelKey: "nav.emergency", href: "/admin/emergency", className: "text-red-400 hover:text-red-500" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-6 bg-primary">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg shadow-sm">
            <Monitor className="text-primary w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ScreenSense</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-primary">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 font-bold uppercase tracking-widest text-[10px]">{t("nav.hub")}</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn("text-white/90 hover:bg-white/10 rounded-xl transition-all h-11", pathname === item.href && "bg-white/20 text-white font-bold")}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-white/60 font-bold uppercase tracking-widest text-[10px]">{t("nav.governance")}</SidebarGroupLabel>
          <SidebarMenu>
            {settings.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn("text-white/90 hover:bg-white/10 rounded-xl transition-all h-11", pathname === item.href && "bg-white/20 text-white font-bold", item.className)}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-primary border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full bg-accent text-primary font-black hover:bg-accent/90 flex items-center justify-between px-4 h-12 rounded-xl shadow-lg shadow-black/20" size="sm">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="uppercase tracking-tighter">{t("nav.actions")}</span>
              </div>
              <ChevronUp className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="w-56 mb-2 rounded-xl shadow-2xl p-2 border-white/10">
            <DropdownMenuItem asChild className="gap-2 cursor-pointer py-3 rounded-lg">
              <Link href="/admin/media">
                <Film className="w-4 h-4 text-muted-foreground" />
                {t("nav.addMedia")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer py-3 rounded-lg">
              <Link href="/display">
                <ExternalLink className="w-4 h-4 text-accent" />
                {t("nav.viewFeed")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer py-3 rounded-lg">
              <Link href="/">
                <Home className="w-4 h-4 text-muted-foreground" />
                {t("nav.exit")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
