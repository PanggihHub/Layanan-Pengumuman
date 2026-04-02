"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Play, FileVideo, Users, Activity, ExternalLink, ArrowUpRight } from "lucide-react";
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
import { INITIAL_MEDIA, PLAYLISTS } from "@/lib/mock-data";

const data = [
  { name: 'Mon', engagement: 420 },
  { name: 'Tue', engagement: 380 },
  { name: 'Wed', engagement: 650 },
  { name: 'Thu', engagement: 920 },
  { name: 'Fri', engagement: 540 },
  { name: 'Sat', engagement: 310 },
  { name: 'Sun', engagement: 190 },
];

const screenStatus = [
  { id: "S-101", name: "Main Hall A", status: "Online", playlist: "Standard Campus Loop", uptime: "14d 2h" },
  { id: "S-102", name: "Library Entrance", status: "Online", playlist: "Quiet Study", uptime: "5d 6h" },
  { id: "S-103", name: "Cafeteria East", status: "Offline", playlist: "Lunch Specials", uptime: "0" },
  { id: "S-104", name: "Admin Block", status: "Online", playlist: "Faculty Updates", uptime: "22d 1h" },
];

export default function AdminOverview() {
  const totalMedia = INITIAL_MEDIA.length;
  const totalPlaylists = PLAYLISTS.length;
  const onlineScreens = screenStatus.filter(s => s.status === "Online").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">System Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, editor. Monitoring {screenStatus.length} screens across the network.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Reports</Button>
          <Button className="bg-primary">Sync All Screens</Button>
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
                  <p className="text-2xl font-bold">{onlineScreens} / {screenStatus.length}</p>
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> 2%
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
                <p className="text-2xl font-bold">{totalMedia}</p>
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
                <p className="text-2xl font-bold">{totalPlaylists}</p>
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
                <p className="text-sm text-muted-foreground">Weekly Views</p>
                <p className="text-2xl font-bold">3.3k</p>
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
            <CardDescription>Estimated daily interaction frequency.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
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
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { time: "2m ago", text: "Main Hall A started 'Orientation Loop'", type: "play" },
                { time: "15m ago", text: "Media library: 'Welcome_Slide_V2' uploaded", type: "genai" },
                { time: "1h ago", text: "Sync: 12 screens updated successfully", type: "sync" },
                { time: "3h ago", text: "System check: All clear", type: "system" }
              ].map((log, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 3 && <div className="absolute left-[3px] top-4 w-px h-8 bg-muted" />}
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 z-10"></div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{log.text}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-6 p-0 text-accent h-auto font-semibold">View Full Activity Log</Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Screen Status</CardTitle>
              <CardDescription>Live health and content monitoring.</CardDescription>
            </div>
            <Button variant="outline" size="sm">Manage Devices</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Device ID</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Location</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Active Playlist</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Uptime</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {screenStatus.map((screen) => (
                  <tr key={screen.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-4 font-mono text-xs">{screen.id}</td>
                    <td className="py-4 font-medium">{screen.name}</td>
                    <td className="py-4">
                      <Badge 
                        variant={screen.status === "Online" ? "default" : "destructive"}
                        className={screen.status === "Online" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {screen.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-muted-foreground">{screen.playlist}</td>
                    <td className="py-4 text-muted-foreground">{screen.uptime}</td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}