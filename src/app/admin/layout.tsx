
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Search, UserCircle, LogOut, Settings, Shield, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You are being redirected to the landing page.",
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white shadow-sm z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 bg-muted/50 border px-3 py-1.5 rounded-full transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search telemetry, assets..." 
                  className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-muted">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                  <DropdownMenuLabel className="p-4 bg-muted/50 border-b">Notifications</DropdownMenuLabel>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 border-b hover:bg-muted/30 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        System Heartbeat
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Screen "Library Entrance" has resumed normal operations.</p>
                    </div>
                    <div className="p-4 border-b hover:bg-muted/30 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Media Sync
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">3 new assets were automatically synced to "Main Hall A".</p>
                    </div>
                  </div>
                  <div className="p-2 text-center bg-muted/20 border-t">
                    <Button variant="link" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary h-auto p-0">
                      Mark all as read
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-muted rounded-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-bold leading-none">Admin User</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">System Overseer</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>Manage Account</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Logged in as admin@screensense.cloud</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/admin/settings">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Security & PIN
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/admin">
                      <History className="w-4 h-4 text-muted-foreground" />
                      Activity Log
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer gap-2 focus:bg-red-50 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
