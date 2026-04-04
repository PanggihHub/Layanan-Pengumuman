
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Monitor, 
  RefreshCw, 
  Settings2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Play,
  Signal,
  MoreVertical,
  Power,
  Eye,
  Search,
  Zap,
  RotateCcw
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SCREEN_STATUS, SCREEN_SETTINGS, PLAYLISTS, INITIAL_MEDIA } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function ScreensManagement() {
  const [ticker, setTicker] = useState(SCREEN_SETTINGS.tickerMessage);
  const [activePlaylistId, setActivePlaylistId] = useState(SCREEN_SETTINGS.activePlaylistId);
  const [isEmergency, setIsEmergency] = useState(SCREEN_SETTINGS.emergencyAlert);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const { toast } = useToast();

  // Dynamic preview logic
  const previewUrls = useMemo(() => {
    const playlist = PLAYLISTS.find(p => p.id === activePlaylistId);
    if (!playlist) return [];
    return playlist.items
      .map(id => INITIAL_MEDIA.find(m => m.id === id)?.url)
      .filter((url): url is string => !!url);
  }, [activePlaylistId]);

  useEffect(() => {
    if (previewUrls.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewUrls.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [previewUrls]);

  const handleSaveSettings = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Settings Published",
        description: "Global display settings have been synced to all active screens.",
      });
    }, 1500);
  };

  const handleEmergencyToggle = (val: boolean) => {
    setIsEmergency(val);
    toast({
      variant: val ? "destructive" : "default",
      title: val ? "EMERGENCY BROADCAST ACTIVE" : "Emergency Resolved",
      description: val 
        ? "Override active. All screens are now displaying the emergency alert." 
        : "Displays returned to standard playback.",
    });
  };

  const handleDeviceAction = (deviceId: string, action: string) => {
    toast({
      title: "Action Initiated",
      description: `${action} command sent to device ${deviceId}.`,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Monitor className="w-8 h-8 text-accent" />
            Screen Management
          </h1>
          <p className="text-muted-foreground">Monitor device health and control global broadcast settings.</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={() => handleSaveSettings()}
          disabled={isSyncing}
        >
          <RefreshCw className={isSyncing ? "animate-spin" : ""} />
          Manual Sync All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Global Display Settings
              </CardTitle>
              <CardDescription>These changes affect all screens connected to the network.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Live Ticker Message</Label>
                <Input 
                  id="ticker" 
                  value={ticker} 
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="Enter message for the bottom ticker..."
                  className="h-12"
                />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Recommended: Under 200 characters for optimal legibility.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Active Global Playlist</Label>
                  <Select value={activePlaylistId} onValueChange={setActivePlaylistId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select Playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYLISTS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Transition</Label>
                  <Select defaultValue="crossfade">
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Effect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crossfade">Smooth Crossfade</SelectItem>
                      <SelectItem value="slide">Slide Horizontal</SelectItem>
                      <SelectItem value="instant">Instant Cut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/10 justify-end py-4">
              <Button onClick={handleSaveSettings} disabled={isSyncing} className="gap-2">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <Zap />}
                {isSyncing ? "Publishing..." : "Update All Screens"}
              </Button>
            </CardFooter>
          </Card>

          <Card className={cn(
            "shadow-md border-2 transition-colors",
            isEmergency ? "border-red-600 bg-red-50" : "border-red-100 bg-red-50/20"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isEmergency ? "bg-red-600 text-white" : "bg-red-100 text-red-600"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className={isEmergency ? "text-red-900" : "text-red-800"}>Emergency Override</CardTitle>
                    <CardDescription className={isEmergency ? "text-red-700" : "text-red-600/70"}>
                      Instantly take over all screens with a critical alert.
                    </CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={isEmergency} 
                  onCheckedChange={handleEmergencyToggle}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Device Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Connected Devices</CardTitle>
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Find screen..." className="bg-transparent text-xs border-none outline-none w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-muted-foreground bg-muted/20">
                    <tr className="border-b">
                      <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">Device</th>
                      <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider text-center">Health</th>
                      <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">Active Loop</th>
                      <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">Uptime</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCREEN_STATUS.map((screen) => (
                      <tr key={screen.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">{screen.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{screen.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge 
                            variant={screen.status === "Online" ? "default" : "destructive"}
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              screen.status === "Online" ? "bg-green-500" : ""
                            )}
                          >
                            {screen.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground truncate max-w-[150px]">
                          {screen.playlist}
                        </td>
                        <td className="px-4 py-4 text-[10px] font-mono text-muted-foreground">
                          {screen.uptime}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeviceAction(screen.id, "Identify")}>
                                <Eye className="w-4 h-4 mr-2" /> Identify Screen
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeviceAction(screen.id, "Refresh")}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Force Refresh
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeviceAction(screen.id, "Reboot")}
                                className="text-orange-600"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" /> Remote Reboot
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeviceAction(screen.id, "Power Off")}
                                className="text-red-600"
                              >
                                <Power className="w-4 h-4 mr-2" /> Power Off
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Proxy Preview */}
        <div className="space-y-6">
          <Card className="shadow-md overflow-hidden bg-black text-white border-none">
            <CardHeader className="bg-primary/20 backdrop-blur-md border-b border-white/10 flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Signal className="text-accent w-4 h-4 animate-pulse" />
                <CardTitle className="text-sm">Live Preview</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/20 text-white">Proxy 720p</Badge>
            </CardHeader>
            <CardContent className="p-0 relative aspect-video group">
              {previewUrls.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden">
                  {previewUrls.map((url, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-1000",
                        i === previewIndex ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <Image 
                        src={url} 
                        alt="Preview" 
                        fill 
                        className="object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1">Active Stream</p>
                    <p className="text-xs font-semibold truncate">
                      {PLAYLISTS.find(p => p.id === activePlaylistId)?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/20 italic">
                  <Monitor className="w-12 h-12" />
                  <p className="text-xs">No media in playlist</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="py-2 px-4 flex justify-between items-center text-[10px] text-white/40">
              <span>Bitrate: 4.2 Mbps</span>
              <span>Uptime: {SCREEN_STATUS[0].uptime}</span>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-white to-muted/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Network Load</span>
                <span className="text-xs font-bold text-green-600">Optimal</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[24%]" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Storage (Media Cache)</span>
                <span className="text-xs font-bold">12.4 / 50 GB</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[25%]" />
              </div>

              <div className="pt-2 border-t mt-4 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Last System Check</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

