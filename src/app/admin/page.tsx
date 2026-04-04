
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Play, FileVideo, Users, Activity, ExternalLink, ArrowUpRight, RefreshCw } from "lucide-react";
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
import { INITIAL_MEDIA, PLAYLISTS, SCREEN_STATUS, ScreenStatus } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [screens, setScreens] = useState<ScreenStatus[]>(SCREEN_STATUS);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  
  // Simulated activity history
  const [history, setHistory] = useState([
    { time: "2m ago", text: "Main Hall A started 'Orientation Loop'", type: "play" },
    { time: "15m ago", text: "Media library: 'Welcome_Slide_V2' uploaded", type: "genai" },
    { time: "1h ago", text: "Sync: 12 screens updated successfully", type: "sync" },
    { time: "3h ago", text: "System check: All clear", type: "system" }
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
    
    // Simulate network delay
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setHistory(prev => [
        { time: "Just now", text: `Global fleet sync initiated at ${now}`, type: "sync" },
        ...prev.slice(0, 3)
      ]);

      toast({
        title: "Fleet Sync Complete",
        description: `Successfully synchronized ${stats.onlineScreens} online screens.`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">System Dashboard</h1>
          <p className="text-muted-foreground">Monitoring {screens.length} screens across the network.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Reports</Button>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm text-muted-foreground">Library Items</p>
                <p className="text-2xl font-bold">{stats.totalMedia}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <FileVideo className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Engagement</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.weeklyViews}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Total Interactions</p>
                </div>
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
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Audience Engagement</CardTitle>
            <CardDescription>Daily interaction frequency based on signage proximity sensor data.</CardDescription>
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

        {/* System Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Admin Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {history.map((log, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== history.length - 1 && <div className="absolute left-[3px] top-4 w-px h-8 bg-muted" />}
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-2 z-10",
                    log.type === 'sync' ? 'bg-primary' : 'bg-accent'
                  )}></div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{log.text}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-6 p-0 text-accent h-auto font-semibold">View Full History</Button>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
