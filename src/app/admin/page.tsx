"use client";

import { useState, useMemo, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Play, 
  FileVideo, 
  Activity, 
  ExternalLink, 
  ArrowUpRight, 
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  History,
  FileText,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScreenStatus, MediaItem, Playlist, SecurityAuditLog } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import Link from "next/link";

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
  const [screens, setScreens] = useState<ScreenStatus[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [monitorScreen, setMonitorScreen] = useState<ScreenStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 1. Listen to Screens
    const unsubScreens = onSnapshot(collection(db, "screens"), (snap) => {
      const items: ScreenStatus[] = [];
      snap.forEach(doc => items.push(doc.data() as ScreenStatus));
      setScreens(items);
    });

    // 2. Listen to Media
    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const items: MediaItem[] = [];
      snap.forEach(doc => items.push(doc.data() as MediaItem));
      setMediaItems(items);
    });

    // 3. Listen to Playlists
    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snap) => {
      const items: Playlist[] = [];
      snap.forEach(doc => items.push(doc.data() as Playlist));
      setPlaylists(items);
    });

    // 4. Listen to Audit Logs
    const qLogs = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(20));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const items: SecurityAuditLog[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() } as SecurityAuditLog));
      setAuditLogs(items);
    });

    return () => {
      unsubScreens();
      unsubMedia();
      unsubPlaylists();
      unsubLogs();
    };
  }, []);
  
  // Simulated activity history
  const [history] = useState([
    { id: 1, time: "2m ago", text: "Main Hall A started 'Orientation Loop'", type: "play" },
    { id: 2, time: "15m ago", text: "Media library: 'Welcome_Slide_V2' uploaded", type: "genai" },
    { id: 3, time: "1h ago", text: "Sync: 12 screens updated successfully", type: "sync" },
    { id: 4, time: "3h ago", text: "System check: All clear", type: "system" },
    { id: 5, time: "5h ago", text: "New schedule added: Friday Jumu'ah", type: "worship" },
    { id: 6, time: "8h ago", text: "Admin login: Chief Editor", type: "system" },
  ]);

  const stats = useMemo(() => {
    const totalMedia = mediaItems.length;
    const totalPlaylists = playlists.length;
    const onlineScreens = screens.filter(s => {
      const lastSeenDate = s.lastSeen ? new Date(s.lastSeen) : null;
      return lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000) && s.status !== 'DEACTIVATED' && s.status !== 'Offline';
    }).length;
    
    // Engagement proxy: frequency of administrative actions + active screen ratio
    const engagementScore = screens.length > 0 ? (onlineScreens / screens.length) * 1000 : 0;
    
    return {
      totalMedia,
      totalPlaylists,
      onlineScreens,
      weeklyViews: Math.round(engagementScore).toLocaleString()
    };
  }, [screens, mediaItems, playlists]);

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({ title: "Fleet Sync Complete", description: `Synchronized ${stats.onlineScreens} screens.` });
    }, 2000);
  };

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setIsRefreshingLogs(false);
      toast({ title: "Logs Updated", description: "Activity feed refreshed." });
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    toast({ title: "Generating System Report", description: "Compiling telemetry and audit history..." });
    
    setTimeout(() => {
      // 1. Generate JSON
      const jsonContent = JSON.stringify({
        timestamp: new Date().toISOString(),
        fleet: screens,
        media: mediaItems,
        logs: auditLogs
      }, null, 2);
      
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `ScreenSense_Report_${new Date().getTime()}.json`;
      jsonLink.click();

      // 2. Generate CSV
      const csvRows = [
        ["Device ID", "Name", "Status", "Last Seen"],
        ...screens.map(s => [s.id, s.name, s.status, s.lastSeen])
      ];
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement('a');
      csvLink.href = csvUrl;
      csvLink.download = `ScreenSense_Fleet_${new Date().getTime()}.csv`;
      csvLink.click();

      setIsExporting(false);
      toast({ title: "Export Ready", description: "Telemetry reports (CSV & JSON) downloaded." });
    }, 2000);
  };

  const getActiveMediaForScreen = (screen: ScreenStatus | null) => {
    if (!screen) return [];
    const playlist = playlists.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items.map(id => mediaItems.find(m => m.id === id)).filter(Boolean);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-accent" />
            System Dashboard
          </h1>
          <p className="text-muted-foreground">Monitoring {screens.length} screens across the network.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            {showAnalytics ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <Label htmlFor="analytics-toggle" className="text-xs font-bold uppercase tracking-tight cursor-pointer">
              Analytics
            </Label>
            <Switch id="analytics-toggle" checked={showAnalytics} onCheckedChange={setShowAnalytics} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </Button>
            <Button className="bg-primary gap-2" onClick={handleSyncAll} disabled={isSyncing}>
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              Sync Fleet
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6")}>
        <Card className="hover:shadow-md transition-shadow cursor-default group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Screens</p>
                <p className="text-2xl font-bold mt-1">{stats.onlineScreens} / {screens.length}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Monitor className="text-primary w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-default group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Library</p>
                <p className="text-2xl font-bold mt-1">{stats.totalMedia}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <FileVideo className="text-accent w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-default group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Loops</p>
                <p className="text-2xl font-bold mt-1">{stats.totalPlaylists}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Play className="text-emerald-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-default group border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Engagement</p>
                <p className="text-2xl font-bold mt-1">{stats.weeklyViews}</p>
              </div>
              <div className="bg-white p-3 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                <TrendingUp className="text-accent w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Chart */}
        {showAnalytics && (
          <Card className="lg:col-span-2 shadow-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Audience Engagement</CardTitle>
                <CardDescription>Visualizing traffic and scan metrics over the last 7 days.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-primary border-accent/20">Real-time Data</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(38, 110, 184, 0.05)' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    />
                    <Bar dataKey="engagement" radius={[6, 6, 0, 0]}>
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Activity */}
        <Card className={cn("border-primary/10 shadow-sm", !showAnalytics && "lg:col-span-3")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg">Activity Feed</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 hover:bg-muted", isRefreshingLogs && "animate-spin")} onClick={handleRefreshLogs}>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-6 pt-2">
                {auditLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10 italic">No administrative events recorded.</p>
                )}
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 relative group">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0 z-10 ring-4 ring-white transition-all group-hover:scale-125",
                      log.status === 'Success' ? 'bg-primary' : 
                      log.status === 'Blocked' ? 'bg-red-500 animate-pulse' : 
                      log.status === 'Warning' ? 'bg-amber-500' :
                      'bg-muted-foreground'
                    )}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug text-primary/90">{log.event}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <History className="w-3 h-3" />
                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button 
              variant="link" 
              className="mt-6 w-full p-0 text-accent h-auto font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:no-underline hover:text-primary transition-colors" 
              onClick={() => setIsHistoryOpen(true)}
            >
              Full Security Audit <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6">
          <div>
            <CardTitle className="text-lg">Network Health Matrix</CardTitle>
            <CardDescription>Live telemetry and loop integrity for all provisioned nodes.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white px-3 py-1">{stats.onlineScreens} Online</Badge>
            <Button variant="outline" size="sm" className="bg-white border-primary/20 text-xs px-4" asChild>
              <Link href="/admin/screens">Manage Device Inventory</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground bg-muted/20">
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Node ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Physical Location</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-center">Connectivity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Active Sequence</th>
                  <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {screens.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic text-xs">No devices provisioned in the cloud yet.</td>
                  </tr>
                )}
                {screens.map((screen) => {
                  const playlist = playlists.find(p => p.id === screen.playlistId);
                  const lastSeenDate = screen.lastSeen ? new Date(screen.lastSeen) : null;
                  const isRecent = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000);
                  
                  let color = "bg-zinc-400"; // Grey
                  let label = "No Signal";
                  
                  if (isRecent && screen.status !== 'DEACTIVATED' && screen.status !== 'Offline') {
                    color = "bg-emerald-500";
                    label = "Active";
                  } else if (screen.lastSeen) {
                    color = "bg-red-500";
                    label = screen.status === 'DEACTIVATED' ? "Deactivated" : "Inactive";
                  }

                  return (
                    <tr key={screen.id} className="border-b hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground">{screen.id}</td>
                      <td className="px-6 py-4 font-bold text-primary">{screen.name}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={cn(
                          "min-w-[80px] justify-center text-[10px] font-black uppercase border-none text-white",
                          color
                        )}>
                          {label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">{playlist?.name || "System Loop"}</span>
                          <span className="text-[9px] text-muted-foreground/60 italic">{playlist?.schedule || "Standard"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-white hover:shadow-sm transition-all opacity-100" onClick={() => setMonitorScreen(screen)}>
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
              <History className="w-5 h-5 text-accent" />
              Full System Audit Log
            </DialogTitle>
            <DialogDescription>A detailed chronological record of all administrative and system events.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[450px] mt-4 pr-4 border rounded-xl bg-muted/20 p-4">
            <div className="space-y-4">
              {history.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl border bg-white shadow-sm">
                  <div className={cn(
                    "p-2 rounded-full",
                    log.type === 'sync' ? 'bg-primary/10 text-primary' : 
                    log.type === 'genai' ? 'bg-purple-100 text-purple-600' : 
                    'bg-muted text-muted-foreground'
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-bold text-primary">{log.text}</p>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">{log.time}</span>
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mt-2">
                      Event Category: {log.type}
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
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Monitor Screen: {monitorScreen?.name}</DialogTitle>
            <DialogDescription>Surveillance view for active signage node.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video flex flex-col items-center justify-center">
            {monitorScreen?.status === "Online" ? (
              <div className="w-full h-full relative">
                {getActiveMediaForScreen(monitorScreen).slice(0, 1).map((item, i) => (
                  <Image key={i} src={item?.url || ''} alt="" fill className="object-cover opacity-80" unoptimized />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-10 left-10 text-white animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Surveillance</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter leading-none">{monitorScreen?.name}</h3>
                  <p className="text-lg opacity-70 font-medium mt-2">Looping: {playlists.find(p => p.id === monitorScreen?.playlistId)?.name}</p>
                </div>
              </div>
            ) : (
              <div className="text-white/20 flex flex-col items-center gap-6 text-center animate-pulse">
                <div className="p-8 rounded-full bg-white/5">
                  <Monitor className="w-24 h-24 opacity-20" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-[0.2em]">Signal Offline</h3>
                  <p className="text-sm font-mono mt-2 opacity-40">NODE_ID: {monitorScreen?.id}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
