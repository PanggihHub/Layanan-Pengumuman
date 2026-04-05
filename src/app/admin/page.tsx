
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
  Sparkles,
  Lightbulb
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
import { recommendDisplayContent, RecommendDisplayContentOutput } from "@/ai/flows/recommend-display-content";

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
  const [aiRecommendation, setAiRecommendation] = useState<RecommendDisplayContentOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  
  // Simulated activity history
  const [history, setHistory] = useState([
    { id: 1, time: "2m ago", text: "Main Hall A started 'Orientation Loop'", type: "play" },
    { id: 2, time: "15m ago", text: "Media library: 'Welcome_Slide_V2' uploaded", type: "genai" },
    { id: 3, time: "1h ago", text: "Sync: 12 screens updated successfully", type: "sync" },
    { id: 4, time: "3h ago", text: "System check: All clear", type: "system" },
    { id: 5, time: "5h ago", text: "New schedule added: Friday Jumu'ah", type: "worship" },
    { id: 6, time: "8h ago", text: "Admin login: Chief Editor", type: "system" },
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

  const handleGetAiRecommendation = async () => {
    setIsAiLoading(true);
    try {
      const result = await recommendDisplayContent({
        timeOfDay: "Morning",
        location: "Main Campus Hall",
        audienceEngagementPatterns: "High student traffic, moderate scan rate",
        availableContentSummary: "playlists: Orientation, MorningNews. items: MathQuiz, WeatherUpdate"
      });
      setAiRecommendation(result);
      setHistory(prev => [
        { id: Date.now(), time: "Just now", text: "AI content strategy generated for morning shift", type: "genai" },
        ...prev
      ]);
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to fetch content recommendation.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory(prev => [
        { id: Date.now(), time: "Just now", text: `Global fleet sync initiated at ${now}`, type: "sync" },
        ...prev
      ]);
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
    toast({ title: "Generating Report", description: "Compiling system telemetry..." });
    setTimeout(() => {
      setIsExporting(false);
      toast({ title: "Export Ready", description: "System_Report.pdf downloaded." });
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Screens</p>
                <p className="text-2xl font-bold">{stats.onlineScreens} / {screens.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Monitor className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assets</p>
                <p className="text-2xl font-bold">{stats.totalMedia}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <FileVideo className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Loops</p>
                <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
              </div>
              <div className="bg-accent/20 p-2 rounded-full">
                <Play className="text-accent w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{stats.weeklyViews}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Chart */}
        {showAnalytics ? (
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Audience Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  AI Smart Recommendations
                </CardTitle>
                <CardDescription>Optimizing content based on hall traffic patterns.</CardDescription>
              </div>
              <Button onClick={handleGetAiRecommendation} disabled={isAiLoading} size="sm" className="gap-2">
                {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                Analyze
              </Button>
            </CardHeader>
            <CardContent>
              {aiRecommendation ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Recommended Strategy</p>
                    <p className="text-sm font-medium leading-relaxed italic">"{aiRecommendation.reasoning}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {aiRecommendation.recommendedContentIds.map((id, i) => (
                      <div key={i} className="px-3 py-2 bg-white border rounded-lg text-xs font-bold flex items-center gap-2">
                        <Badge variant="outline" className="h-5 w-5 p-0 justify-center">#</Badge>
                        {id}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Run AI analysis to get data-driven scheduling tips.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Activity
            </CardTitle>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", isRefreshingLogs && "animate-spin")} onClick={handleRefreshLogs}>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {history.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3 relative">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-2 z-10",
                    log.type === 'sync' ? 'bg-primary' : (log.type === 'genai' ? 'bg-purple-500' : 'bg-muted-foreground')
                  )}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{log.text}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-6 p-0 text-accent h-auto font-semibold flex items-center gap-2" onClick={() => setIsHistoryOpen(true)}>
              Full Audit Trail <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Network Health</CardTitle>
              <CardDescription>Live telemetry for every provisioned panel.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/screens">Manage Devices</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground bg-muted/20">
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">ID</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Location</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[9px]">Active Loop</th>
                  <th className="px-4 py-3 text-right">Monitor</th>
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
                        <Badge className={cn(screen.status === "Online" ? "bg-emerald-500" : "bg-red-500")}>
                          {screen.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{playlist?.name}</td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100" onClick={() => setMonitorScreen(screen)}>
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
            <DialogTitle>Audit Log</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4 pr-4">
            <div className="space-y-4">
              {history.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{log.text}</p>
                    <p className="text-[10px] uppercase font-black text-muted-foreground">{log.time}</p>
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
          <DialogHeader className="sr-only">
            <DialogTitle>Monitor Screen: {monitorScreen?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video flex flex-col items-center justify-center">
            {monitorScreen?.status === "Online" ? (
              <div className="w-full h-full relative">
                {getActiveMediaForScreen(monitorScreen).slice(0, 1).map((item, i) => (
                  <Image key={i} src={item?.url || ''} alt="" fill className="object-cover opacity-80" unoptimized />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-2xl font-bold">{monitorScreen?.name}</h3>
                  <p className="text-sm opacity-70">Looping: {PLAYLISTS.find(p => p.id === monitorScreen?.playlistId)?.name}</p>
                </div>
              </div>
            ) : (
              <div className="text-white/20 flex flex-col items-center gap-4 text-center">
                <Monitor className="w-24 h-24 opacity-20" />
                <h3 className="text-2xl font-black uppercase tracking-widest">Signal Offline</h3>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
