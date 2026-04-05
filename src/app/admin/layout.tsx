"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Search, 
  UserCircle, 
  LogOut, 
  Settings, 
  Shield, 
  History,
  Command,
  Monitor,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    toast({
      title: "Security: Logging out...",
      description: "Ending administrative session safely.",
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background font-body">
        <AdminSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white shadow-sm z-[100] sticky top-0">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="hover:bg-muted" />
              <Separator orientation="vertical" className="h-6" />
              
              {/* Intelligent Search Bar */}
              <div className={cn(
                "relative flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 border",
                isSearchFocused 
                  ? "bg-white w-[500px] ring-4 ring-primary/5 border-primary shadow-2xl" 
                  : "bg-muted/50 border-transparent w-72 lg:w-96"
              )}>
                <Search className={cn("w-4 h-4 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground/60")} />
                <input 
                  type="text" 
                  placeholder="Search telemetry, assets, screens..." 
                  className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground/40"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="hidden sm:flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg text-[10px] font-bold text-muted-foreground border shadow-sm">
                  <Command className="w-2.5 h-2.5" /> K
                </div>

                {/* Simulated Search Results Dropdown */}
                {isSearchFocused && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl border shadow-2xl p-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3 border-b">Real-time Indexing</p>
                    <div className="space-y-1 p-1">
                      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl text-left transition-colors">
                        <Monitor className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">Main Hall A (Online)</span>
                          <span className="text-[10px] text-muted-foreground">Screen Telemetry</span>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl text-left transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">All Clear Response</span>
                          <span className="text-[10px] text-muted-foreground">Emergency Protocol</span>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 rounded-xl text-left transition-colors">
                        <AlertCircle className="w-4 h-4 text-accent" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">Worship Sync Failure</span>
                          <span className="text-[10px] text-muted-foreground">System Alert</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Command Center */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-full w-10 h-10 transition-transform active:scale-95">
                    <Bell className="w-5 h-5 text-muted-foreground/80" />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-2xl rounded-2xl border-primary/10">
                  <DropdownMenuLabel className="p-4 bg-muted/50 border-b flex items-center justify-between">
                    <span className="font-bold">System Alerts</span>
                    <Badge variant="outline" className="bg-white text-[10px] font-black uppercase tracking-widest">Live</Badge>
                  </DropdownMenuLabel>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b hover:bg-primary/5 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Fleet Synchronization
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">Screen "Library Entrance" has successfully resumed normal operations after update.</p>
                      <p className="text-[9px] text-muted-foreground/40 font-mono mt-2">14:22:15 UTC</p>
                    </div>
                    <div className="p-4 border-b hover:bg-accent/10 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2 text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Resource Sync Active
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">3 new assets were automatically synced to "Main Hall A" node.</p>
                      <p className="text-[9px] text-muted-foreground/40 font-mono mt-2">12:10:05 UTC</p>
                    </div>
                  </div>
                  <div className="p-3 text-center bg-muted/20 border-t">
                    <Button variant="link" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary h-auto p-0 hover:no-underline hover:text-primary/70">
                      View System Audit Log
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* Admin Overseer Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-3 px-2 pr-4 hover:bg-muted rounded-2xl transition-all h-12 active:scale-95 group">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center border-2 border-primary/20 shadow-lg group-hover:rotate-3 transition-transform">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-black text-primary leading-none">Admin Overseer</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">Master Console</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 shadow-2xl rounded-2xl p-2 border-primary/10">
                  <DropdownMenuLabel className="flex flex-col px-4 py-3">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Account Security</span>
                    <span className="text-[11px] font-medium text-primary mt-1">admin@screensense.local</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2" />
                  <DropdownMenuItem asChild className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-primary/5">
                    <Link href="/admin/settings">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Platform Config</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-accent/10">
                    <Link href="/admin/security">
                      <Shield className="w-4 h-4 text-accent" />
                      <span className="font-semibold text-sm">Security & PIN</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-muted">
                    <Link href="/admin">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Access Audit Log</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mx-2" />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer gap-3 p-3 rounded-xl focus:bg-red-50 focus:text-red-600 font-black tracking-tight"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">END SESSION</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth bg-background">
            <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
