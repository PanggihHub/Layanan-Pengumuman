
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
  CheckCircle2
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
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white shadow-sm z-50">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              
              {/* Optimized Search Bar */}
              <div className={cn(
                "relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border",
                isSearchFocused 
                  ? "bg-white w-96 ring-2 ring-primary/20 border-primary" 
                  : "bg-muted/50 border-transparent w-64 lg:w-80"
              )}>
                <Search className={cn("w-4 h-4", isSearchFocused ? "text-primary" : "text-muted-foreground")} />
                <input 
                  type="text" 
                  placeholder="Search telemetry, assets, screens..." 
                  className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground/60"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground border">
                  <Command className="w-2.5 h-2.5" /> K
                </div>

                {/* Simulated Search Results */}
                {isSearchFocused && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Quick Results</p>
                    <div className="space-y-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-left">
                        <Monitor className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Display: Main Hall A</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-left">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">Status: All Clear</span>
                      </button>
                    </div>
                  </div>
                )}
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
                <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden shadow-2xl">
                  <DropdownMenuLabel className="p-4 bg-muted/50 border-b">System Alerts</DropdownMenuLabel>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 border-b hover:bg-muted/30 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Fleet Synchronization
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Screen "Library Entrance" has resumed normal operations.</p>
                    </div>
                    <div className="p-4 border-b hover:bg-muted/30 transition-colors cursor-default">
                      <p className="font-bold text-xs flex items-center gap-2 text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Resource Sync
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">3 new assets were automatically synced to "Main Hall A".</p>
                    </div>
                  </div>
                  <div className="p-2 text-center bg-muted/20 border-t">
                    <Button variant="link" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary h-auto p-0">
                      View Audit Log
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-muted rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-bold leading-none">Admin Overseer</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Master Console</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-2xl">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>Account Security</span>
                    <span className="text-[10px] font-normal text-muted-foreground">admin@screensense.local</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/admin/settings">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Platform Config
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/admin/security">
                      <Shield className="w-4 h-4 text-accent" />
                      Security & PIN
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/admin">
                      <History className="w-4 h-4 text-muted-foreground" />
                      Access Log
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer gap-2 focus:bg-red-50 focus:text-red-600 font-bold"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    End Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
