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
  RotateCcw,
  Edit,
  Layout
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SCREEN_STATUS, SCREEN_SETTINGS, PLAYLISTS, INITIAL_MEDIA, ScreenStatus } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ScreensManagement() {
  const [ticker, setTicker] = useState(SCREEN_SETTINGS.tickerMessage);
  const [activePlaylistId, setActivePlaylistId] = useState(SCREEN_SETTINGS.activePlaylistId);
  const [isEmergency, setIsEmergency] = useState(SCREEN_SETTINGS.emergencyAlert);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewDeviceId, setPreviewDeviceId] = useState(SCREEN_STATUS[0].id);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  // Individual Screen Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenStatus | null>(null);
  const [localScreenPlaylist, setLocalScreenPlaylist] = useState("");
  const [localScreenName, setLocalScreenName] = useState("");

  const { toast } = useToast();

  // Dynamic preview logic based on selected preview device
  const previewUrls = useMemo(() => {
    const screen = SCREEN_STATUS.find(s => s.id === previewDeviceId);
    if (!screen) return [];
    const playlist = PLAYLISTS.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items
      .map(id => INITIAL_MEDIA.find(m => m.id === id)?.url)
      .filter((url): url is string => !!url);
  }, [previewDeviceId]);

  useEffect(() => {
    if (previewUrls.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewUrls.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [previewUrls]);

  const handleSaveGlobalSettings = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Global Publish Successful",
        description: "Settings synced to the entire screen network.",
      });
    }, 1500);
  };

  const handleOpenEdit = (screen: ScreenStatus) => {
    setEditingScreen(screen);
    setLocalScreenName(screen.name);
    setLocalScreenPlaylist(screen.playlistId);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSpecificScreen = () => {
    if (!editingScreen) return;
    toast({
      title: "Device Updated",
      description: `Settings for ${localScreenName} have been deployed specifically.`,
    });
    setIsEditDialogOpen(false);
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
      title: "Command Sent",
      description: `${action} signal triggered for device ${deviceId}.`,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Monitor className="w-8 h-8 text-accent" />
            Display Network Orchestration
          </h1>
          <p className="text-muted-foreground">Manage device-specific configurations and global overrides.</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={handleSaveGlobalSettings}
          disabled={isSyncing}
        >
          <RefreshCw className={isSyncing ? "animate-spin" : ""} />
          Manual Force Sync (All)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Layout className="w-5 h-5" />
                Global Fleet Configuration
              </CardTitle>
              <CardDescription>Broadcasting these settings will affect every connected panel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Global Ticker Feed</Label>
                <Input 
                  id="ticker" 
                  value={ticker} 
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="Enter broadcast message..."
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Master Fleet Playlist</Label>
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
                <div className="space-y-2 flex flex-col justify-end">
                   <Button onClick={handleSaveGlobalSettings} disabled={isSyncing} className="gap-2 h-10">
                    {isSyncing ? <RefreshCw className="animate-spin" /> : <Zap className="w-4 h-4" />}
                    Publish Fleet Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "shadow-md border-2 transition-all duration-500",
            isEmergency ? "border-red-600 bg-red-50 ring-4 ring-red-100" : "border-red-100 bg-red-50/20"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-red-100 text-red-600"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className={isEmergency ? "text-red-900" : "text-red-800"}>Emergency Broadcast Protocol</CardTitle>
                    <CardDescription className={isEmergency ? "text-red-700" : "text-red-600/70"}>
                      Instantly hijack all connected screens with high-priority safety content.
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
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20">
              <div>
                <CardTitle>Fleet Inventory</CardTitle>
                <CardDescription>Live telemetry for {SCREEN_STATUS.length} devices.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Filter fleet..." className="bg-transparent text-xs border-none outline-none w-32" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-muted-foreground bg-muted/10 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Panel Details</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Connectivity</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Active Loop</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Uptime</th>
                      <th className="px-6 py-4 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCREEN_STATUS.map((screen) => (
                      <tr key={screen.id} className="border-b hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-muted/40 group-hover:bg-primary/10">
                              <Monitor className="w-4 h-4 text-primary/70" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{screen.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{screen.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge 
                            variant={screen.status === "Online" ? "default" : "destructive"}
                            className={cn(
                              "text-[9px] px-2 py-0.5",
                              screen.status === "Online" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                            )}
                          >
                            {screen.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                          {PLAYLISTS.find(p => p.id === screen.playlistId)?.name}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-mono text-muted-foreground">
                          {screen.uptime}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary"
                              onClick={() => handleOpenEdit(screen)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleDeviceAction(screen.id, "Flash LED")}>
                                  <Eye className="w-4 h-4 mr-2" /> Identify Screen
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPreviewDeviceId(screen.id)}>
                                  <Monitor className="w-4 h-4 mr-2" /> Spy View (Live)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeviceAction(screen.id, "Rebooting...")}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" /> Remote Reboot
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeviceAction(screen.id, "Shutting down...")}
                                  className="text-red-600"
                                >
                                  <Power className="w-4 h-4 mr-2" /> Power Down
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
          <Card className="shadow-xl overflow-hidden bg-black text-white border-none ring-1 ring-white/10">
            <CardHeader className="bg-primary/30 backdrop-blur-xl border-b border-white/10 flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <CardTitle className="text-xs font-bold tracking-widest uppercase">Live Surveillance</CardTitle>
              </div>
              <Select value={previewDeviceId} onValueChange={setPreviewDeviceId}>
                <SelectTrigger className="w-32 h-7 text-[10px] bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCREEN_STATUS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        alt="Proxy View" 
                        fill 
                        className="object-cover opacity-70"
                        unoptimized
                      />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 pointer-events-none">
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest">Active Broadcast</p>
                    <p className="text-sm font-bold truncate">
                      {PLAYLISTS.find(p => p.id === SCREEN_STATUS.find(s => s.id === previewDeviceId)?.playlistId)?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/20 italic bg-zinc-950">
                  <Monitor className="w-12 h-12" />
                  <p className="text-xs">No active content signal</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="py-2.5 px-4 flex justify-between items-center text-[9px] text-white/40 font-mono bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <span>ENC: H.264</span>
                <span>ID: {previewDeviceId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3 text-emerald-500" />
                <span>LATENCY: 42ms</span>
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-white to-muted/50 shadow-sm border-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Signal className="w-4 h-4 text-primary" />
                Network Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Fleet Payload</span>
                  <span className="text-[10px] font-bold text-emerald-600">Stable (Low)</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[18%]" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Cloud Sync Storage</span>
                  <span className="text-[10px] font-bold">12.4 GB / 50 GB</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[24%]" />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Last Fleet Scan</span>
                  <span className="text-xs font-mono font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Active Nodes</span>
                  <span className="text-xs font-bold text-emerald-600">3 / 4 Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Individual Screen Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Configure {editingScreen?.id}
            </DialogTitle>
            <DialogDescription>
              Deploy configuration overrides specifically for this physical display panel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Panel Display Name</Label>
              <Input 
                value={localScreenName} 
                onChange={(e) => setLocalScreenName(e.target.value)} 
                placeholder="e.g. Science Lab West"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Assigned Playlist</Label>
              <Select value={localScreenPlaylist} onValueChange={setLocalScreenPlaylist}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Playlist" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYLISTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg text-[10px] text-muted-foreground border border-dashed flex gap-2">
              <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Updating this will override the global fleet settings for this device until the next manual sync.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSpecificScreen} className="gap-2">
              <Zap className="w-4 h-4" />
              Deploy to Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
