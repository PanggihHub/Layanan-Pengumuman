
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Play, FileVideo, Users, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const data = [
  { name: 'Mon', engagement: 400 },
  { name: 'Tue', engagement: 300 },
  { name: 'Wed', engagement: 600 },
  { name: 'Thu', engagement: 800 },
  { name: 'Fri', engagement: 500 },
  { name: 'Sat', engagement: 200 },
  { name: 'Sun', engagement: 150 },
];

const screenStatus = [
  { id: "S-101", name: "Main Hall A", status: "Online", playlist: "Campus News v2", uptime: "14d 2h" },
  { id: "S-102", name: "Library Entrance", status: "Online", playlist: "Quiet Study", uptime: "5d 6h" },
  { id: "S-103", name: "Cafeteria East", status: "Offline", playlist: "Lunch Specials", uptime: "0" },
  { id: "S-104", name: "Admin Block", status: "Online", playlist: "Faculty Updates", uptime: "22d 1h" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">System Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, editor. Here's what's happening on your network.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Reports</Button>
          <Button className="bg-primary">Sync All Screens</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Screens</p>
                <p className="text-2xl font-bold">12 / 14</p>
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
                <p className="text-sm text-muted-foreground">Library Items</p>
                <p className="text-2xl font-bold">248</p>
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
                <p className="text-sm text-muted-foreground">Total Playlists</p>
                <p className="text-2xl font-bold">32</p>
              </div>
              <div className="bg-accent/20 p-2 rounded-full">
                <Play className="text-accent w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagements</p>
                <p className="text-2xl font-bold">12.4k</p>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Audience Engagement</CardTitle>
            <CardDescription>Interaction frequency across all interactive displays.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { time: "2m ago", text: "Main Hall A started playing 'Orientation 2024'", type: "play" },
                { time: "15m ago", text: "New science fact generated by AI", type: "genai" },
                { time: "1h ago", text: "Library screen sync completed", type: "sync" },
                { time: "3h ago", text: "Emergency broadcast test successful", type: "system" }
              ].map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2"></div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{log.text}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-4 p-0 text-accent h-auto">View Full Activity Log</Button>
          </CardContent>
        </Card>
      </div>

      {/* Screen Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Screen Status</CardTitle>
              <CardDescription>Monitor live connectivity and active content.</CardDescription>
            </div>
            <Button variant="outline" size="sm">Manage Devices</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 font-semibold text-muted-foreground">Device ID</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Location</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Status</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Active Playlist</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Uptime</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {screenStatus.map((screen) => (
                  <tr key={screen.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-4 font-medium">{screen.id}</td>
                    <td className="py-4">{screen.name}</td>
                    <td className="py-4">
                      <Badge variant={screen.status === "Online" ? "default" : "destructive"}>
                        {screen.status}
                      </Badge>
                    </td>
                    <td className="py-4">{screen.playlist}</td>
                    <td className="py-4">{screen.uptime}</td>
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
