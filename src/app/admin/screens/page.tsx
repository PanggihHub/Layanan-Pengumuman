
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Monitor, 
  RefreshCw, 
  Settings2, 
  Play,
  Signal,
  WifiOff,
  Wifi,
  CloudCog,
  Link2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ZapOff,
  Search,
  Zap,
  UploadCloud,
  Edit
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { SCREEN_STATUS, SCREEN_SETTINGS, PLAYLISTS, INITIAL_MEDIA, ScreenStatus } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ScreensManagement() {
  const [ticker, setTicker] = useState(SCREEN_SETTINGS.tickerMessage);
  const [activePlaylistId, setActivePlaylistId] = useState(SCREEN_SETTINGS.activePlaylistId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewDeviceId, setPreviewDeviceId] = useState<string | null>(SCREEN_STATUS[0]?.id || null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [scanTime, setScanTime] = useState<string | null>(null);
  
  const [fleet, setFleet] = useState<ScreenStatus[]>(SCREEN_STATUS);
  const [deactivatedIds, setDeactivatedIds] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenStatus | null>(null);
  const [localScreenPlaylist, setLocalScreenPlaylist] = useState("");
  const [localScreenName, setLocalScreenName] = useState("");
  const [integritySetting, setIntegritySetting] = useState("standard");

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [linkUnitName, setLinkUnitName] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const [screenToDelete, setScreenToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const previewUrls = useMemo(() => {
    if (!previewDeviceId) return [];
    const screen = fleet.find(s => s.id === previewDeviceId);
    if (!screen || deactivatedIds.includes(screen.id) || screen.status === 'Offline') return [];
    const playlist = PLAYLISTS.find(p => p.id === screen.playlistId);
    if (!playlist) return [];
    return playlist.items
      .map(id => INITIAL_MEDIA.find(m => m.id === id)?.url)
      .filter((url): url is string => !!url);
  }, [previewDeviceId, deactivatedIds, fleet]);

  useEffect(() => {
    setScanTime(new Date().toLocaleTimeString());

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
      setScanTime(new Date().toLocaleTimeString());
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
      setFleet(prev => prev.map(s => 
        s.id === editingScreen.id ? { ...s, name: localScreenName, playlistId: localScreenPlaylist } : s
      ));
      setIsDeploying(false);
      setIsEditDialogOpen(false);
      setScanTime(new Date().toLocaleTimeString());
      toast({
        title: "Device Deployment Successful",
        description: `Content and integrity policy successfully pushed to ${localScreenName}.`,
      });
    }, 2000);
  };

  const handleDeleteDevice = (id: string) => {
    setFleet(prev => prev.filter(s => s.id !== id));
    setScreenToDelete(null);
    toast({
      title: "Node Decommissioned",
      description: `Hardware unit ${id} has been removed.`,
      variant: "destructive"
    });
  };

  const handleLinkNewDevice = () => {
    if (!pairingCode || !linkUnitName) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsLinking(true);
    setTimeout(() => {
      const newId = `S-${Math.floor(Math.random() * 900) + 100}`;
      const newScreen: ScreenStatus = {
        id: newId,
        name: linkUnitName,
        status: "Online",
        playlistId: "system-default",
        uptime: "Just linked",
        lastSeen: "Just now"
      };
      setFleet(prev => [...prev, newScreen]);
      setIsLinking(false);
      setIsLinkDialogOpen(false);
      setPairingCode("");
      setLinkUnitName("");
      toast({ title: "Hardware Linked", description: `Device ${newId} is now online.` });
    }, 2500);
  };

  const handleToggleOnlineStatus = (id: string) => {
    const screen = fleet.find(s => s.id === id);
    if (!screen) return;
    const newStatus = screen.status === 'Online' ? 'Offline' : 'Online';
    setFleet(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    toast({
      title: `Device ${newStatus}`,
      description: `Connectivity updated for ${screen.name}.`,
    });
  };

  const handleToggleDeactivation = (deviceId: string) => {
    const isDeactivating = !deactivatedIds.includes(deviceId);
    if (isDeactivating) {
      setDeactivatedIds(prev => [...prev, deviceId]);
      toast({ title: "Device Deactivated", variant: "destructive" });
    } else {
      setDeactivatedIds(prev => prev.filter(id => id !== deviceId));
      toast({ title: "Device Reconnected" });
    }
  };

  const selectedScreen = fleet.find(s => s.id === previewDeviceId);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Monitor className="w-8 h-8 text-accent" />
            Display Network Orchestration
          </h1>
          <p className="text-muted-foreground">Manage device-specific configurations and worship loops.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={() => setIsLinkDialogOpen(true)}>
            <Link2 className="w-4 h-4" />
            Link New Unit
          </Button>
          <Button variant="default" onClick={handleSaveGlobalSettings} disabled={isSyncing}>
            <RefreshCw className={isSyncing ? "animate-spin" : ""} />
            Fleet Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
        {/* Inventory Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <CloudCog className="w-5 h-5 text-accent" />
                    Global Fleet Orchestrator
                  </CardTitle>
                  <CardDescription>Broadcasting settings for all active nodes.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-accent text-primary text-[10px] font-bold">
                  {fleet.filter(s => !deactivatedIds.includes(s.id) && s.status === 'Online').length} Active Nodes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Global Ticker Feed</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ticker" 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="Enter broadcast message..."
                    className="flex-1"
                  />
                  <Button variant="secondary" onClick={() => toast({ title: "Ticker Updated" })}>Update</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Master Fleet Playlist</Label>
                  <Select value={activePlaylistId} onValueChange={setActivePlaylistId}>
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
                <div className="space-y-2 flex flex-col justify-end">
                   <Button onClick={handleSaveGlobalSettings} disabled={isSyncing} className="gap-2 h-10">
                    {isSyncing ? <RefreshCw className="animate-spin" /> : <Zap className="w-4 h-4" />}
                    Deploy Fleet Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b py-4 px-6">
              <div>
                <CardTitle className="text-lg">Fleet Inventory</CardTitle>
                <CardDescription>Live telemetry for {fleet.length} provisioned panels.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search devices..." className="bg-transparent text-xs border-none outline-none w-32" />
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
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleet.map((screen) => {
                      const isDeactivated = deactivatedIds.includes(screen.id);
                      const isOffline = screen.status === 'Offline';
                      const isSelected = previewDeviceId === screen.id;
                      return (
                        <tr key={screen.id} className={cn(
                          "border-b transition-colors group cursor-pointer",
                          isDeactivated ? "bg-muted/30 grayscale" : (isSelected ? "bg-primary/10" : "hover:bg-primary/5")
                        )} onClick={() => setPreviewDeviceId(screen.id)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded transition-colors",
                                isDeactivated ? "bg-muted" : "bg-primary/5"
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
                              variant={!isDeactivated && !isOffline ? "default" : "destructive"}
                              className={cn(
                                "text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest min-w-[80px] justify-center",
                                !isDeactivated && !isOffline ? "bg-emerald-500 hover:bg-emerald-600" : (isDeactivated ? "bg-zinc-500" : "bg-red-400")
                              )}
                            >
                              {isDeactivated ? "DEACTIVATED" : screen.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                            {isDeactivated || isOffline ? "IDLE" : PLAYLISTS.find(p => p.id === screen.playlistId)?.name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                  <Settings2 className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(screen); }} disabled={isDeactivated}>
                                  <Edit className="w-4 h-4 mr-2" /> Configure Node
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleOnlineStatus(screen.id); }} disabled={isDeactivated}>
                                  {isOffline ? (
                                    <><Wifi className="w-4 h-4 mr-2 text-emerald-600" /> Power On</>
                                  ) : (
                                    <><WifiOff className="w-4 h-4 mr-2 text-red-600" /> Power Off</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleDeactivation(screen.id); }}>
                                  {isDeactivated ? (
                                    <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Reactivate Node</>
                                  ) : (
                                    <><ZapOff className="w-4 h-4 mr-2 text-red-600" /> Deactivate Node</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setScreenToDelete(screen.id); }} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" /> Decommission Node
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Optimized Sticky Sidebar */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <Card className="shadow-2xl overflow-hidden bg-black text-white border-none ring-1 ring-white/20 transform transition-all duration-300 hover:ring-white/40">
            <CardHeader className="bg-primary/40 backdrop-blur-3xl border-b border-white/10 flex flex-row items-center justify-between py-4 px-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.3)]",
                  previewUrls.length > 0 ? "bg-emerald-500 animate-pulse shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50"
                )} />
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">Live Telemetry Proxy</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] text-white border-white/30 font-bold bg-white/5 backdrop-blur-sm">
                {selectedScreen?.id || "NO_SIGNAL"}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 relative aspect-video bg-zinc-950">
              {previewUrls.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden">
                  {previewUrls.map((url, i) => (
                    <div key={i} className={cn("absolute inset-0 transition-opacity duration-1000", i === previewIndex ? "opacity-100" : "opacity-0")}>
                      <Image src={url} alt="Signage View" fill className="object-cover opacity-70 scale-105" unoptimized />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1.5 pointer-events-none">
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest flex items-center gap-2">
                      <Signal className="w-3.5 h-3.5 fill-accent animate-pulse" /> BROADCASTING: {selectedScreen?.name}
                    </p>
                    <p className="text-base font-black tracking-tight drop-shadow-lg truncate">
                      {PLAYLISTS.find(p => p.id === selectedScreen?.playlistId)?.name}
                    </p>
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">Status: Active Loop • Uptime: {selectedScreen?.uptime}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white/20 italic animate-pulse">
                  <div className="p-6 rounded-full bg-white/5 border border-white/10">
                    <Monitor className="w-16 h-16 opacity-30" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-black tracking-[0.3em] uppercase">No Active Link</p>
                    <p className="text-[9px] font-mono opacity-40">WAITING_FOR_HANDSHAKE...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-muted/30 shadow-xl border-primary/10 overflow-hidden group">
            <CardHeader className="pb-4 border-b bg-muted/40 px-5 transition-colors group-hover:bg-muted/60">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-primary">
                <div className="p-1.5 bg-primary/10 rounded-md">
                   <Signal className="w-4 h-4" />
                </div>
                Network Health Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-5 px-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-3 rounded-xl bg-white border shadow-sm">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">Fleet Scan</span>
                  <span className="text-sm font-black text-primary font-mono">{scanTime || "--:--:--"}</span>
                </div>
                <div className="flex flex-col p-3 rounded-xl bg-white border shadow-sm text-right">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">Integrity</span>
                  <span className="text-sm font-black text-emerald-600">98.4%</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground/80 px-1">
                   <span>Resource Load</span>
                   <span>34%</span>
                </div>
                <Progress value={34} className="h-1.5 bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Node Configuration
            </DialogTitle>
            <DialogDescription>Deploy localized overrides for unit {editingScreen?.id}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">1. Network Identity</Label>
              <Input value={localScreenName} onChange={(e) => setLocalScreenName(e.target.value)} disabled={isDeploying} placeholder="e.g. Science Wing Panel" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2. Broadcast Loop</Label>
              <Select value={localScreenPlaylist} onValueChange={setLocalScreenPlaylist} disabled={isDeploying}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAYLISTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">3. Operational Integrity</Label>
              <Select value={integritySetting} onValueChange={setIntegritySetting} disabled={isDeploying}>
                <SelectTrigger>
                  <SelectValue placeholder="Integrity Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (60s Heartbeat)</SelectItem>
                  <SelectItem value="high">Mission Critical (10s Heartbeat)</SelectItem>
                  <SelectItem value="low">Eco Mode (300s Heartbeat)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Defines the frequency of connectivity validation pings.
              </p>
            </div>

            {isDeploying && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-primary/20">
                <div className="flex justify-between text-[10px] font-bold uppercase text-primary">
                  <span>Uploading Config...</span>
                  <span>{deployProgress}%</span>
                </div>
                <Progress value={deployProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={isDeploying}>Cancel</Button>
            <Button onClick={handleUpdateSpecificScreen} disabled={isDeploying} className="gap-2">
              {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isDeploying ? "Deploying..." : "Push to Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Link2 className="w-5 h-5" />
              Pair Original Hardware
            </DialogTitle>
            <DialogDescription>Enter pairing code displayed on the monitor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
              <Label className="text-primary font-black uppercase text-[10px]">6-Digit Pairing Code</Label>
              <Input value={pairingCode} onChange={(e) => setPairingCode(e.target.value.toUpperCase())} className="h-14 text-2xl font-black text-center tracking-[0.2em]" maxLength={6} disabled={isLinking} />
            </div>
            <div className="space-y-2">
              <Label>Assigned Location</Label>
              <Input value={linkUnitName} onChange={(e) => setLinkUnitName(e.target.value)} disabled={isLinking} />
            </div>
            {isLinking && <Progress value={65} className="h-1.5" />}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)} disabled={isLinking}>Cancel</Button>
            <Button onClick={handleLinkNewDevice} disabled={isLinking} className="bg-primary">{isLinking ? "Verifying..." : "Link Hardware"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!screenToDelete} onOpenChange={() => setScreenToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Decommission</AlertDialogTitle>
            <AlertDialogDescription>Remove node {screenToDelete}? This permanently severs the cloud link.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => screenToDelete && handleDeleteDevice(screenToDelete)} className="bg-red-600">Decommission</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
