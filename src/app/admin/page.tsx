"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Play, 
  FileVideo, 
  Users, 
  Activity, 
  ExternalLink, 
  ArrowUpRight, 
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  History,
  FileText,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INITIAL_MEDIA, PLAYLISTS, SCREEN_STATUS, ScreenStatus } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const engagementData = [
  { name: 'Mon', engagement: 420 },
  { name: 'Tue', engagement: 380 },
  { name: 'Wed', engagement: 650 },
  { name: 'Thu', engagement: 920 },
  { name: 'Fri', engagement: 540 },
  { name: 'Sat', engagement: 310 },
  { name: 'Sun', engagement: 190 },
];

export default function AdminOverview() {
  const [screens] = useState<ScreenStatus[]>(SCREEN_STATUS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [monitorScreen, setMonitorScreen] = useState<ScreenStatus | null>(null);
  const { toast } = useToast();
  
  // Simulated activity history
  const [history, setHistory] = useState([
    { id: 1, time: "2m ago", text: "Main Hall A started 'Orientation Loop'", type: "play" },
    { id: 2, time: "15m ago", text: "Media library: 'Welcome_Slide_V2' uploaded", type: "genai" },
    { id: 3, time: "1h ago", text: "Sync: 12 screens updated successfully", type: "sync" },
    { id: 4, time: "3h ago", text: "System check: All clear", type: "system" },
    { id: 5, time: "5h ago", text: "New schedule added: Friday Jumu'ah", type: "worship" },
    { id: 6, time: "8h ago", text: "Admin login: Chief Editor", type: "system" },
    { id: 7, time: "Yesterday", text: "Emergency protocol test completed", type: "sync" }
  ]);

  const stats = useMemo(() => {
    const totalMedia = INITIAL_MEDIA.length;
    const totalPlaylists = PLAYLISTS.length;
    const onlineScreens = screens.filter(s => s.status === "Online").length;
    const weeklyViews = engagementData.reduce((acc, curr) => acc + curr.engagement, 0);
    
    return {
      totalMedia,
      totalPlaylists,
      onlineScreens,
      weeklyViews: weeklyViews.toLocaleString()
    };
  }, [screens]);

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setHistory(prev => [
        { id: Date.now(), time: "Just now", text: `Global fleet sync initiated at ${now}`, type: "sync" },
        ...prev
      ]);

      toast({
        title: "Fleet Sync Complete",
        description: `Successfully synchronized ${stats.onlineScreens} online screens.`,
      });
    }, 2000);
  };

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setIsRefreshingLogs(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory(prev => [
        { id: Date.now(), time: "Just now", text: `System-wide telemetry scan completed at ${now}`, type: "system" },
        ...prev
      ]);
      toast({
        title: "Logs Updated",
        description: "Activity feed has been refreshed with latest telemetry.",
      });
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    toast({
      title: "Generating Report",
      description: "Compiling system telemetry and engagement data...",
    });

    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export Ready",
        description: "System_Report_Q4.pdf has been saved to your downloads.",
      });
    }, 3000);
  };

  const getActiveMediaForScreen = (screen: ScreenStatus | null) => {
    if (!screen) return [];
    const playlist = PLAYLISTS.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items.map(id => INITIAL_MEDIA.find(m => m.id === id)).filter(Boolean);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">System Dashboard</h1>
          <p className="text-muted-foreground">Monitoring {screens.length} screens across the network.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            {showAnalytics ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <Label htmlFor="analytics-toggle" className="text-xs font-bold uppercase tracking-tight cursor-pointer">
              Analytics
            </Label>
            <Switch 
              id="analytics-toggle" 
              checked={showAnalytics} 
              onCheckedChange={setShowAnalytics}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Exporting..." : "Export Reports"}
            </Button>
            <Button 
              className="bg-primary gap-2" 
              onClick={handleSyncAll}
              disabled={isSyncing}
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync All Screens
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6",
        showAnalytics ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Screens</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.onlineScreens} / {screens.length}</p>
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> Online
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Monitor className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Library Assets</p>
                <p className="text-2xl font-bold">{stats.totalMedia}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <FileVideo className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {!showAnalytics && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Broadcast Loops</p>
                  <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
                </div>
                <div className="bg-accent/20 p-2 rounded-full">
                  <Play className="text-accent w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showAnalytics && (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Playlists</p>
                    <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
                  </div>
                  <div className="bg-accent/20 p-2 rounded-full">
                    <Play className="text-accent w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Engagement</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{stats.weeklyViews}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Interactions</p>
                    </div>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="text-purple-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Chart */}
        {showAnalytics && (
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audience Engagement</CardTitle>
                <CardDescription>Daily interaction frequency based on proximity sensor data.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">LIVE TELEMETRY</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f8f8f8' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Activity */}
        <Card className={cn(
          "shadow-sm",
          !showAnalytics && "lg:col-span-3"
        )}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Admin Activity Log
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", isRefreshingLogs && "animate-spin")}
              onClick={handleRefreshLogs}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "space-y-6",
              !showAnalytics && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0"
            )}>
              {history.slice(0, showAnalytics ? 4 : 6).map((log, i) => (
                <div key={log.id} className="flex gap-3 relative">
                  {(showAnalytics && i !== (showAnalytics ? 3 : 5)) && <div className="absolute left-[3px] top-4 w-px h-8 bg-muted" />}
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-2 z-10",
                    log.type === 'sync' ? 'bg-primary' : (log.type === 'worship' ? 'bg-accent' : 'bg-muted-foreground')
                  )}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{log.text}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="link" 
              className="mt-6 p-0 text-accent h-auto font-semibold flex items-center gap-2"
              onClick={() => setIsHistoryOpen(true)}
            >
              View Full History <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Network Health & Content</CardTitle>
              <CardDescription>Live telemetry and active loop status for every provisioned panel.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/screens">Device Manager</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground bg-muted/20">
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Panel ID</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Display Location</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Active Loop (Playlist)</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Fleet Uptime</th>
                  <th className="px-4 py-3 text-right">Monitoring</th>
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => {
                  const playlist = PLAYLISTS.find(p => p.id === screen.playlistId);
                  return (
                    <tr key={screen.id} className="border-b hover:bg-primary/5 transition-colors group">
                      <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground">{screen.id}</td>
                      <td className="px-4 py-4 font-bold text-primary">{screen.name}</td>
                      <td className="px-4 py-4">
                        <Badge 
                          variant={screen.status === "Online" ? "default" : "destructive"}
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-widest",
                            screen.status === "Online" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                          )}
                        >
                          {screen.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">
                        {playlist ? playlist.name : "System Default"}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-muted-foreground">
                        {screen.status === "Online" ? screen.uptime : "---"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMonitorScreen(screen)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Full History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              System Audit Log
            </DialogTitle>
            <DialogDescription>
              Complete record of administrative actions and automated system events.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4 pr-4">
            <div className="space-y-4">
              {history.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20">
                  <div className={cn(
                    "p-2 rounded-full",
                    log.type === 'sync' ? 'bg-primary/10 text-primary' : 
                    (log.type === 'worship' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-primary">{log.text}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{log.time}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mt-1">
                      Event Type: {log.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Monitoring Dialog */}
      <Dialog open={!!monitorScreen} onOpenChange={() => setMonitorScreen(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-none">
          <div className="relative aspect-video flex flex-col items-center justify-center">
            {monitorScreen?.status === "Online" ? (
              <div className="w-full h-full relative">
                {getActiveMediaForScreen(monitorScreen).map((item, i) => (
                  <div key={i} className="absolute inset-0 opacity-100 transition-opacity">
                    <Image 
                      src={item?.url || 'https://picsum.photos/seed/placeholder/1920/1080'} 
                      alt="" 
                      fill 
                      className="object-cover opacity-80" 
                      unoptimized 
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Live Proxy Feed</span>
                  </div>
                  <h3 className="text-2xl font-bold">{monitorScreen?.name}</h3>
                  <p className="text-sm opacity-70">Looping: {PLAYLISTS.find(p => p.id === monitorScreen?.playlistId)?.name}</p>
                </div>
              </div>
            ) : (
              <div className="text-white/20 flex flex-col items-center gap-4 text-center p-12">
                <Monitor className="w-24 h-24 opacity-20" />
                <h3 className="text-2xl font-black uppercase tracking-widest">Signal Offline</h3>
                <p className="text-sm font-medium italic">Device {monitorScreen?.id} is not responding to heartbeat signals.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
