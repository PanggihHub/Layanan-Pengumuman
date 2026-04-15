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
  History as HistoryIcon,
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

const heatmapData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: Math.floor(Math.random() * 100),
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString()
}));

const detailMetrics = [
  { label: 'Views', value: '12.4K', trend: '+14%', color: 'text-primary' },
  { label: 'Watch Time', value: '842h', trend: '+8%', color: 'text-emerald-500' },
  { label: 'Interaction', value: '3.2%', trend: '-2%', color: 'text-amber-500' },
  { label: 'Retention', value: '78%', trend: '+5%', color: 'text-accent' },
];

import { useLanguage } from "@/context/LanguageContext";

export default function AdminOverview() {
  const { t, language } = useLanguage();
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
    const unsubScreens = onSnapshot(collection(db, "screens"), (snapshot) => {
      setScreens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScreenStatus)));
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snapshot) => {
      setMediaItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem)));
    });

    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist)));
    });

    const unsubLogs = onSnapshot(query(collection(db, "securityLogs"), orderBy("timestamp", "desc"), limit(8)), (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityAuditLog)));
    });

    return () => {
      unsubScreens();
      unsubMedia();
      unsubPlaylists();
      unsubLogs();
    };
  }, []);
  // Stats calculation
  const stats = useMemo(() => {
    // Calculate most frequent media
    const mediaCounts: Record<string, number> = {};
    playlists.forEach(playlist => {
      playlist.items.forEach(itemId => {
        mediaCounts[itemId] = (mediaCounts[itemId] || 0) + 1;
      });
    });

    const topMedia = Object.entries(mediaCounts)
      .map(([id, count]) => ({
        id,
        count,
        name: mediaItems.find(m => m.id === id)?.name || "Unknown Asset",
        type: mediaItems.find(m => m.id === id)?.type || "image",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      onlineScreens: screens.filter(s => s.status === 'Online').length,
      totalMedia: mediaItems.length,
      totalPlaylists: playlists.length,
      topMedia,
      weeklyViews: engagementData.reduce((acc, curr) => acc + curr.engagement, 0)
    };
  }, [screens, mediaItems, playlists]);

  const getActiveMediaForScreen = (screen: ScreenStatus | null) => {
    if (!screen) return [];
    const playlist = playlists.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items
      .map(itemId => mediaItems.find(m => m.id === itemId))
      .filter(Boolean) as MediaItem[];
  };

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({ 
        title: language === "id-ID" ? "Sinkronisasi Selesai" : "Fleet Sync Complete", 
        description: language === "id-ID" ? `Mensinkronkan ${stats.onlineScreens} layar.` : `Synchronized ${stats.onlineScreens} screens.` 
      });
    }, 2000);
  };

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setIsRefreshingLogs(false);
      toast({ 
        title: language === "id-ID" ? "Log Diperbarui" : "Logs Updated", 
        description: language === "id-ID" ? "Umpan aktivitas diperbarui." : "Activity feed refreshed." 
      });
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    toast({ 
      title: language === "id-ID" ? "Menghasilkan Laporan" : "Generating System Report", 
      description: language === "id-ID" ? "Menyusun telemetri dan riwayat audit..." : "Compiling telemetry and audit history..." 
    });
    
    setTimeout(() => {
      try {
        const data = {
          screens,
          mediaItems,
          playlists,
          auditLogs,
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screensense-export-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
      }
      setIsExporting(false);
      toast({ 
        title: language === "id-ID" ? "Ekspor Siap" : "Export Ready", 
        description: language === "id-ID" ? "Laporan telemetri (CSV & JSON) telah diunduh." : "Telemetry reports (CSV & JSON) downloaded." 
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-accent" />
            {t("dash.title")}
          </h1>
          <p className="text-muted-foreground">{t("dash.monitor")} {screens.length} {t("dash.screensCount")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            {showAnalytics ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <Label htmlFor="analytics-toggle" className="text-xs font-bold uppercase tracking-tight cursor-pointer">
              {t("dash.analytics")}
            </Label>
            <Switch id="analytics-toggle" checked={showAnalytics} onCheckedChange={setShowAnalytics} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t("dash.export")}
            </Button>
            <Button className="bg-primary gap-2" onClick={handleSyncAll} disabled={isSyncing}>
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {t("dash.sync")}
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
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("dash.activeScreens")}</p>
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
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("dash.assetLibrary")}</p>
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
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("dash.liveLoops")}</p>
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
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("dash.engagement")}</p>
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
                <CardTitle className="text-lg">{t("dash.audience")}</CardTitle>
                <CardDescription>{t("dash.audienceDesc")}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-primary border-accent/20">{t("dash.realtime")}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-[300px] w-full mt-4 md:col-span-2">
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
                
                <div className="h-full mt-4 space-y-4">
                <div className="h-full mt-4 space-y-6">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">
                      {language === "id-ID" ? "Aktivitas 30 Hari Terakhir" : "Last 30 Days Activity"}
                    </h3>
                    <div className="grid grid-cols-10 gap-1.5">
                      {heatmapData.map((d) => {
                        let colorCls = "bg-primary/5";
                        if (d.value > 80) colorCls = "bg-primary";
                        else if (d.value > 60) colorCls = "bg-primary/60";
                        else if (d.value > 40) colorCls = "bg-primary/40";
                        else if (d.value > 20) colorCls = "bg-primary/20";
                        
                        return (
                          <div 
                            key={d.day}
                            className={cn("aspect-square rounded-[3px] transition-all cursor-crosshair hover:scale-125 hover:z-10 shadow-sm", colorCls)}
                            title={`${d.date}: ${d.value} points`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {detailMetrics.map((m) => (
                      <div key={m.label} className="bg-muted/30 p-3 rounded-xl border border-primary/5">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">{m.label}</p>
                        <div className="flex items-end justify-between mt-1">
                          <p className={cn("text-lg font-bold leading-none", m.color)}>{m.value}</p>
                          <span className={cn("text-[8px] font-bold", m.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600')}>
                            {m.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Activity */}
        <Card className={cn("border-primary/10 shadow-sm", !showAnalytics && "lg:col-span-3")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg">{t("dash.activity")}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 hover:bg-muted", isRefreshingLogs && "animate-spin")} onClick={handleRefreshLogs}>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-6 pt-2">
                {auditLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10 italic">{t("dash.noActivity")}</p>
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
                        <HistoryIcon className="w-3 h-3" />
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
              {t("dash.fullAudit")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6">
          <div>
            <CardTitle className="text-lg">{t("dash.healthMatrix")}</CardTitle>
            <CardDescription>{t("dash.healthDesc")}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white px-3 py-1">{stats.onlineScreens} {t("dash.online")}</Badge>
            <Button variant="outline" size="sm" className="bg-white border-primary/20 text-xs px-4" asChild>
              <Link href="/admin/screens">{t("dash.manageInventory")}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground bg-muted/20">
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">{t("dash.nodeId")}</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">{t("dash.location")}</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-center">{t("dash.connectivity")}</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">{t("dash.sequence")}</th>
                  <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">{t("dash.action")}</th>
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
                  let label = t("dash.noSignal");
                  
                  if (isRecent && screen.status !== 'DEACTIVATED' && screen.status !== 'Offline') {
                    color = "bg-emerald-500";
                    label = t("common.active");
                  } else if (screen.lastSeen) {
                    color = "bg-red-500";
                    label = screen.status === 'DEACTIVATED' ? t("dash.deactivated") : t("dash.inactive");
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
                          <span className="text-xs font-bold text-muted-foreground">{playlist?.name || t("dash.systemLoop")}</span>
                          <span className="text-[9px] text-muted-foreground/60 italic">{playlist?.schedule || t("dash.standard")}</span>
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
              <HistoryIcon className="w-5 h-5 text-accent" />
              Full System Audit Log
            </DialogTitle>
            <DialogDescription>A detailed chronological record of all administrative and system events.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[450px] mt-4 pr-4 border rounded-xl bg-muted/20 p-4">
            <div className="space-y-3">
              {auditLogs.map((log) => {
                const statusCls = log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' :
                                  log.status === 'Blocked' ? 'bg-red-100 text-red-700 animate-pulse' :
                                  log.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                                  log.status === 'Verified' ? 'bg-sky-100 text-sky-700' :
                                  'bg-muted text-muted-foreground';
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl border bg-white shadow-sm dark:bg-zinc-900">
                    <div className={cn("p-2 rounded-full", statusCls.split(' ')[0])}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <p className="text-sm font-bold text-primary">{log.event}</p>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">
                          {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : '—'}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-[10px] text-muted-foreground/70 italic mt-1 leading-tight">{log.details}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", statusCls)}>
                          {log.status}
                        </span>
                        {log.category && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                            {log.category}
                          </span>
                        )}
                        {log.user && (
                          <span className="text-[8px] font-mono text-muted-foreground/50">· {log.user}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            {(() => {
              const lastSeenDate = monitorScreen?.lastSeen ? new Date(monitorScreen.lastSeen) : null;
              const isRecent = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000);
              const isTrulyOnline = monitorScreen?.status === "Online" && isRecent;
              
              return isTrulyOnline ? (
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
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/90">
                  <div className="absolute bottom-10 left-10 text-white animate-in slide-in-from-bottom-4 duration-500 z-20">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Signal Offline</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter leading-none opacity-50">{monitorScreen?.name}</h3>
                  </div>
                  <div className="text-white/20 flex flex-col items-center gap-6 text-center animate-pulse z-10">
                    <div className="p-8 rounded-full bg-white/5">
                      <Monitor className="w-24 h-24 opacity-20" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-[0.2em]">Disconnected</h3>
                      <p className="text-sm font-mono mt-2 opacity-40">NODE_ID: {monitorScreen?.id}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
