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
  Layout,
  UploadCloud,
  WifiOff,
  Wifi,
  CloudCog
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
import { Progress } from "@/components/ui/progress";
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
  
  // Fleet State
  const [deactivatedIds, setDeactivatedIds] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);

  // Individual Screen Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenStatus | null>(null);
  const [localScreenPlaylist, setLocalScreenPlaylist] = useState("");
  const [localScreenName, setLocalScreenName] = useState("");

  const { toast } = useToast();

  // Dynamic preview logic based on selected preview device
  const previewUrls = useMemo(() => {
    const screen = SCREEN_STATUS.find(s => s.id === previewDeviceId);
    if (!screen || deactivatedIds.includes(screen.id)) return [];
    const playlist = PLAYLISTS.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items
      .map(id => INITIAL_MEDIA.find(m => m.id === id)?.url)
      .filter((url): url is string => !!url);
  }, [previewDeviceId, deactivatedIds]);

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
        description: "Settings synced to the entire active screen network.",
      });
    }, 1500);
  };

  const handleOpenEdit = (screen: ScreenStatus) => {
    setEditingScreen(screen);
    setLocalScreenName(screen.name);
    setLocalScreenPlaylist(screen.playlistId);
    setIsEditDialogOpen(true);
    setDeployProgress(0);
    setIsDeploying(false);
  };

  const handleUpdateSpecificScreen = () => {
    if (!editingScreen) return;
    
    setIsDeploying(true);
    setDeployProgress(10);
    
    const interval = setInterval(() => {
      setDeployProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 200);

    setTimeout(() => {
      setIsDeploying(false);
      setIsEditDialogOpen(false);
      toast({
        title: "Device Deployment Successful",
        description: `Content and config successfully pushed to ${localScreenName}.`,
      });
    }, 2000);
  };

  const handleToggleDeactivation = (deviceId: string) => {
    const isDeactivating = !deactivatedIds.includes(deviceId);
    if (isDeactivating) {
      setDeactivatedIds(prev => [...prev, deviceId]);
      toast({
        title: "Device Deactivated",
        description: `Connectivity severed for ${deviceId}. Screen is now idle.`,
        variant: "destructive"
      });
    } else {
      setDeactivatedIds(prev => prev.filter(id => id !== deviceId));
      toast({
        title: "Device Reconnected",
        description: `${deviceId} is back online and syncing.`,
      });
    }
  };

  const handleEmergencyToggle = (val: boolean) => {
    setIsEmergency(val);
    toast({
      variant: val ? "destructive" : "default",
      title: val ? "EMERGENCY BROADCAST ACTIVE" : "Emergency Resolved",
      description: val 
        ? "Override active. All connected screens are now displaying the emergency alert." 
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSaveGlobalSettings}
            disabled={isSyncing}
          >
            <RefreshCw className={isSyncing ? "animate-spin" : ""} />
            Manual Fleet Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <CloudCog className="w-5 h-5 text-accent" />
                    Global Fleet Orchestrator
                  </CardTitle>
                  <CardDescription>Broadcasting these settings will affect every connected panel.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-accent text-primary">
                  {SCREEN_STATUS.length - deactivatedIds.length} Active Nodes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Global Ticker Feed</Label>
                <Input 
                  id="ticker" 
                  value={ticker} 
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="Enter broadcast message..."
                  className="h-12 border-primary/20 focus:ring-primary"
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
                   <Button onClick={handleSaveGlobalSettings} disabled={isSyncing} className="gap-2 h-10 shadow-lg shadow-primary/20">
                    {isSyncing ? <RefreshCw className="animate-spin" /> : <Zap className="w-4 h-4" />}
                    Deploy Fleet Update
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
                    "p-3 rounded-xl shadow-inner",
                    isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-red-100 text-red-600"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg", isEmergency ? "text-red-900" : "text-red-800")}>Emergency Broadcast Protocol</CardTitle>
                    <CardDescription className={isEmergency ? "text-red-700" : "text-red-600/70"}>
                      Instantly hijack all connected screens with high-priority safety content.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-red-800/60">{isEmergency ? "Live Override" : "Ready"}</span>
                   <Switch 
                    checked={isEmergency} 
                    onCheckedChange={handleEmergencyToggle}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Device Table */}
          <Card className="shadow-sm overflow-hidden border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b py-4">
              <div>
                <CardTitle className="text-lg">Fleet Inventory</CardTitle>
                <CardDescription>Live telemetry for {SCREEN_STATUS.length} provisioned panels.</CardDescription>
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
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Panel ID & Location</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Connectivity</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Active Loop</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Uptime</th>
                      <th className="px-6 py-4 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCREEN_STATUS.map((screen) => {
                      const isDeactivated = deactivatedIds.includes(screen.id);
                      return (
                        <tr key={screen.id} className={cn(
                          "border-b transition-colors group",
                          isDeactivated ? "bg-muted/30 grayscale" : "hover:bg-primary/5"
                        )}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded transition-colors",
                                isDeactivated ? "bg-muted" : "bg-primary/5 group-hover:bg-primary/10"
                              )}>
                                <Monitor className={cn("w-4 h-4", isDeactivated ? "text-muted-foreground" : "text-primary/70")} />
                              </div>
                              <div className="flex flex-col">
                                <span className={cn("font-bold", isDeactivated ? "text-muted-foreground" : "text-primary")}>
                                  {screen.name}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">{screen.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge 
                              variant={!isDeactivated && screen.status === "Online" ? "default" : "destructive"}
                              className={cn(
                                "text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest",
                                !isDeactivated && screen.status === "Online" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-400"
                              )}
                            >
                              {isDeactivated ? "DEACTIVATED" : screen.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                            {isDeactivated ? "IDLE" : PLAYLISTS.find(p => p.id === screen.playlistId)?.name}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-mono text-muted-foreground">
                            {isDeactivated ? "--" : screen.uptime}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary"
                                onClick={() => handleOpenEdit(screen)}
                                disabled={isDeactivated}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem onClick={() => setPreviewDeviceId(screen.id)} disabled={isDeactivated}>
                                    <Eye className="w-4 h-4 mr-2" /> Live Surveillance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeviceAction(screen.id, "Identification Flash")}>
                                    <Zap className="w-4 h-4 mr-2" /> Identify Physical Unit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleToggleDeactivation(screen.id)}>
                                    {isDeactivated ? (
                                      <><Wifi className="w-4 h-4 mr-2 text-emerald-600" /> Reactivate Node</>
                                    ) : (
                                      <><WifiOff className="w-4 h-4 mr-2 text-red-600" /> Deactivate Link</>
                                    )}
                                  </DropdownMenuItem>
                                  {!isDeactivated && (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeviceAction(screen.id, "Remote Reboot")}
                                        className="text-orange-600"
                                      >
                                        <RotateCcw className="w-4 h-4 mr-2" /> Remote Reboot
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeviceAction(screen.id, "Safe Shut down")}
                                        className="text-red-600"
                                      >
                                        <Power className="w-4 h-4 mr-2" /> Power Down Unit
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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

        {/* Live Proxy Preview */}
        <div className="space-y-6">
          <Card className="shadow-xl overflow-hidden bg-black text-white border-none ring-1 ring-white/10">
            <CardHeader className="bg-primary/30 backdrop-blur-xl border-b border-white/10 flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                  previewUrls.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                )} />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest">Surveillance Feed</CardTitle>
              </div>
              <Select value={previewDeviceId} onValueChange={setPreviewDeviceId}>
                <SelectTrigger className="w-32 h-7 text-[10px] bg-white/10 border-white/20 text-white rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCREEN_STATUS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0 relative aspect-video group bg-zinc-950">
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
                        className="object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 pointer-events-none">
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-accent" /> Active Signal
                    </p>
                    <p className="text-sm font-bold truncate">
                      {PLAYLISTS.find(p => p.id === SCREEN_STATUS.find(s => s.id === previewDeviceId)?.playlistId)?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 italic">
                  <Monitor className="w-12 h-12" />
                  <p className="text-[10px] font-bold tracking-widest uppercase">Signal Lost / Idle</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="py-2.5 px-4 flex justify-between items-center text-[9px] text-white/40 font-mono bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <span>H.265 / 4K</span>
                <span>ID: {previewDeviceId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Signal className={cn("w-3 h-3", previewUrls.length > 0 ? "text-emerald-500" : "text-red-500")} />
                <span>42ms LATENCY</span>
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-white to-muted/50 shadow-sm border-primary/5 overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Signal className="w-4 h-4 text-primary" />
                Fleet Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Network Load</span>
                  <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[22%]" />
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
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Connected</span>
                  <span className="text-xs font-bold text-emerald-600">{SCREEN_STATUS.length - deactivatedIds.length} / {SCREEN_STATUS.length} Units</span>
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
              Node Configuration
            </DialogTitle>
            <DialogDescription>
              Deploy configuration overrides specifically for {editingScreen?.id}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Panel Display Name</Label>
              <Input 
                value={localScreenName} 
                onChange={(e) => setLocalScreenName(e.target.value)} 
                placeholder="e.g. Science Lab West"
                disabled={isDeploying}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Target Playlist (Loop)</Label>
              <Select value={localScreenPlaylist} onValueChange={setLocalScreenPlaylist} disabled={isDeploying}>
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

            {isDeploying && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                  <span>Uploading Config Payload...</span>
                  <span>{deployProgress}%</span>
                </div>
                <Progress value={deployProgress} className="h-2" />
              </div>
            )}

            {!isDeploying && (
              <div className="p-3 bg-muted/40 rounded-lg text-[10px] text-muted-foreground border border-dashed flex gap-2">
                <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Updating this node will bypass the master fleet settings until the next manual fleet sync.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={isDeploying}>Cancel</Button>
            <Button onClick={handleUpdateSpecificScreen} disabled={isDeploying} className="gap-2 min-w-[140px]">
              {isDeploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {isDeploying ? "Deploying..." : "Push to Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
