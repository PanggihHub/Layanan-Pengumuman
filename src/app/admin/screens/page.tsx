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
  ShieldAlert,
  ZapOff,
  Search,
  Zap,
  UploadCloud,
  Edit,
  Info,
  X,
  Radio
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
import { ScreenStatus, Playlist, MediaItem } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export default function ScreensManagement() {
  const { t, language } = useLanguage();
  const [ticker, setTicker] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewDeviceId, setPreviewDeviceId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [scanTime, setScanTime] = useState<string | null>(null);
  
  const [fleet, setFleet] = useState<ScreenStatus[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenStatus | null>(null);
  const [localScreenPlaylist, setLocalScreenPlaylist] = useState("");
  const [localScreenName, setLocalScreenName] = useState("");

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [linkUnitName, setLinkUnitName] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [generatedPairCode, setGeneratedPairCode] = useState("");


  const [screenToDelete, setScreenToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setScanTime(new Date().toLocaleTimeString());

    const unsubFleet = onSnapshot(collection(db, "screens"), (snap) => {
      const items: ScreenStatus[] = [];
      snap.forEach((doc) => items.push(doc.data() as ScreenStatus));
      
      // Virtual A/B Preview Node - Always present locally for admin testing
      items.push({
        id: "virtual-ab-hub",
        name: "A/B Preview Simulator",
        status: "Online",
        lastSeen: new Date().toISOString(),
        playlistId: activePlaylistId,
        location: "Virtual Console",
        uptime: "Cloud Master"
      });
      
      setFleet(items);
      if (items.length > 0 && !previewDeviceId) setPreviewDeviceId("virtual-ab-hub");
    });

    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snap) => {
      const items: Playlist[] = [];
      snap.forEach((doc) => items.push(doc.data() as Playlist));
      setPlaylists(items);
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const items: MediaItem[] = [];
      snap.forEach((doc) => items.push(doc.data() as MediaItem));
      setMediaItems(items);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setTicker(data.tickerMessage || "");
        setActivePlaylistId(data.activePlaylistId || "");
        setTimezone(data.timezone || "Asia/Jakarta");
      }
    });

    // Cleanup stale pairing codes (codes expire after 15 minutes)
    const cleanupPairing = async () => {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const q = query(collection(db, "pairingCodes"), where("createdAt", "<", fifteenMinsAgo));
        const snap = await getDocs(q);
        snap.forEach(async (d) => await deleteDoc(doc(db, "pairingCodes", d.id)));
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };
    cleanupPairing();

    return () => {
      unsubFleet();
      unsubPlaylists();
      unsubMedia();
      unsubSettings();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const previewUrls = useMemo(() => {
    if (!previewDeviceId) return [];
    const screen = fleet.find(s => s.id === previewDeviceId);
    if (!screen || screen.status === 'DEACTIVATED' || screen.status === 'Offline') return [];
    
    // Fallback logic
    const pId = screen.playlistId || activePlaylistId;
    const playlist = playlists.find(p => p.id === pId);
    
    if (!playlist) return [];
    return playlist.items
      .map(id => mediaItems.find(m => m.id === id)?.url)
      .filter((url): url is string => !!url);
  }, [previewDeviceId, fleet, playlists, mediaItems, activePlaylistId]);

  useEffect(() => {
    setScanTime(new Date().toLocaleTimeString());

    if (previewUrls.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewUrls.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [previewUrls]);

  const handleSaveGlobalSettings = async () => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, "settings", "global"), { 
        tickerMessage: ticker, 
        activePlaylistId, 
        timezone,
        lastFleetSync: serverTimestamp()
      }, { merge: true });
      setScanTime(new Date().toLocaleTimeString());
      toast({
        title: language === "id-ID" ? "Publikasi Global Berhasil" : "Global Publish Successful",
        description: language === "id-ID" ? "Pengaturan disinkronkan ke seluruh jaringan layar aktif." : "Settings synced to the entire active screen network.",
      });
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Gagal Sinkron" : "Sync Failed",
        description: language === "id-ID" ? "Gagal memperbarui pengaturan global." : "Failed to update global settings.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEdit = (screen: ScreenStatus) => {
    setEditingScreen(screen);
    setLocalScreenName(screen.name);
    setLocalScreenPlaylist(screen.playlistId);
    setDeployProgress(0);
    setIsDeploying(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSpecificScreen = async () => {
    if (!editingScreen) return;
    
    setIsDeploying(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setDeployProgress(progress);
    }, 200);

    try {
      await setDoc(doc(db, "screens", editingScreen.id), {
         ...editingScreen,
         name: localScreenName,
         playlistId: localScreenPlaylist 
      }, { merge: true });

      // Simulate a bit of extra time for progress to feel real
      await new Promise(r => setTimeout(r, 1000));
      
      setIsEditDialogOpen(false);
      setScanTime(new Date().toLocaleTimeString());
      toast({
        title: language === "id-ID" ? "Penerapan Perangkat Berhasil" : "Device Deployment Successful",
        description: language === "id-ID" ? `Konten dan kebijakan integritas berhasil dikirim ke ${localScreenName}.` : `Content and integrity policy successfully pushed to ${localScreenName}.`,
      });
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Penerapan Gagal" : "Deployment Failed",
        description: language === "id-ID" ? "Gagal memperbarui perangkat." : "Failed to update device.",
        variant: "destructive"
      });
    } finally {
      clearInterval(interval);
      setIsDeploying(false);
      setDeployProgress(0);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await deleteDoc(doc(db, "screens", id));
      setScreenToDelete(null);
      toast({
        title: language === "id-ID" ? "Node Dinonaktifkan Permanen" : "Node Decommissioned",
        description: language === "id-ID" ? `Unit hardware ${id} telah dihapus.` : `Hardware unit ${id} has been removed.`,
        variant: "destructive"
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete node.",
        variant: "destructive"
      });
    }
  };

  const handleResetHandshake = async (id: string) => {
    await setDoc(doc(db, "screens", id), { 
      lastSeen: null,
      status: "Waiting" 
    }, { merge: true });
    
    toast({
      title: language === "id-ID" ? "Handshake Diatur Ulang" : "Handshake Reset",
      description: language === "id-ID" ? "Identitas koneksi dihapus. Menunggu sinkronisasi telemetri baru." : "Connection identity cleared. Waiting for fresh telemetry sync.",
    });
  };

  const handleLinkNewDevice = async () => {
    if (!linkUnitName) {
      toast({ 
        title: language === "id-ID" ? "Kesalahan" : "Error", 
        description: language === "id-ID" ? "Nama unit wajib diisi." : "Unit name is required.", 
        variant: "destructive" 
      });
      return;
    }

    if (!pairingCode && !generatedPairCode) {
      toast({ 
        title: language === "id-ID" ? "Kesalahan" : "Error", 
        description: language === "id-ID" ? "Keamanan atau kode klien diperlukan." : "Pairing code or client code is required.", 
        variant: "destructive" 
      });
      return;
    }

    setIsLinking(true);
    
    try {
      // CASE 1: Admin wants to activate the dashboard-generated code for a display to enter
      // They either typed it, or it was just generated and they left the field empty
      if (pairingCode === generatedPairCode || (!pairingCode && generatedPairCode)) {
        const codeToUse = pairingCode || generatedPairCode;
        const pairId = `PAUSE-${codeToUse}`;
        await setDoc(doc(db, "adminInitiatedPairing", pairId), {
          code: codeToUse,
          name: linkUnitName,
          playlistId: activePlaylistId || "system-default",
          location: linkUnitName, // Default location to name
          createdAt: new Date().toISOString()
        });

        toast({ 
          title: language === "id-ID" ? "Kode Pemasangan Aktif" : "Pairing Code Active", 
          description: language === "id-ID" 
            ? `Masukkan kode ${codeToUse} pada layar display Anda.` 
            : `Enter the code ${codeToUse} on your display screen.`,
        });
        
        setIsLinking(false);
        // We don't close the dialog yet, so they can see the code boxes
        return;
      }

      // CASE 2: Client-initiated pairing (the display showed a code, admin typed it here)
      const q = query(collection(db, "pairingCodes"), where("code", "==", pairingCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ 
          title: language === "id-ID" ? "Kode Tidak Valid" : "Invalid Code", 
          description: language === "id-ID" 
            ? "Mungkin kode salah ketik atau sudah kadaluarsa (15 menit)." 
            : "The code might be mistyped or expired (valid for 15 mins).", 
          variant: "destructive" 
        });
        setIsLinking(false);
        return;
      }

      const pairingData = querySnapshot.docs[0].data();
      const deviceId = pairingData.deviceId;

      const newScreen: ScreenStatus = {
        id: deviceId,
        name: linkUnitName,
        status: "Online",
        playlistId: activePlaylistId || "system-default",
        location: linkUnitName,
        uptime: "Just Linked",
        lastSeen: new Date().toISOString()
      };

      await setDoc(doc(db, "screens", deviceId), newScreen);
      // Delete the pairing code after successful link
      await deleteDoc(doc(db, "pairingCodes", querySnapshot.docs[0].id));

      setTimeout(() => {
        setIsLinking(false);
        setIsLinkDialogOpen(false);
        setPairingCode("");
        setGeneratedPairCode("");
        setLinkUnitName("");
        toast({ 
          title: language === "id-ID" ? "Perangkat Terhubung" : "Hardware Linked", 
          description: language === "id-ID" ? `Perangkat ${deviceId} sekarang online.` : `Device ${deviceId} is now online.` 
        });
      }, 800);
    } catch (error) {
      console.error(error);
      toast({ 
        title: language === "id-ID" ? "Penautan Gagal" : "Linking Failed", 
        description: language === "id-ID" ? "Gagal menghubungi database. Periksa koneksi." : "Failed to contact database. Check your connection.", 
        variant: "destructive" 
      });
      setIsLinking(false);
    }
  };

  const handleToggleOnlineStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Online' ? 'Offline' : 'Online';
    await setDoc(doc(db, "screens", id), { status: newStatus }, { merge: true });
    toast({
      title: language === "id-ID" ? "Status Perangkat Berubah" : "Device Status Changed",
      description: language === "id-ID" ? `Perangkat sekarang ${newStatus === 'Online' ? 'Aktif' : 'Nonaktif'}.` : `Device is now ${newStatus}.`,
    });
  };

  const handleToggleDeactivation = async (screen: ScreenStatus) => {
    const isDeactivated = screen.status === 'DEACTIVATED';
    const newStatus = isDeactivated ? 'Online' : 'DEACTIVATED';
    await setDoc(doc(db, "screens", screen.id), { status: newStatus }, { merge: true });
    toast({ 
      title: isDeactivated 
        ? (language === "id-ID" ? "Perangkat Terhubung Kembali" : "Device Reconnected") 
        : (language === "id-ID" ? "Perangkat Dinonaktifkan" : "Device Deactivated") 
    });
  };

  const selectedScreen = fleet.find(s => s.id === previewDeviceId);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Monitor className="w-8 h-8 text-accent" />
            {t("scr.title")}
          </h1>
          <p className="text-muted-foreground">{t("scr.desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white rounded-xl" onClick={() => {
            setGeneratedPairCode(Math.floor(100000 + Math.random() * 900000).toString());
            setIsLinkDialogOpen(true);
          }}>
            <Link2 className="w-4 h-4" />
            {language === "id-ID" ? "Tautkan Unit / Pasangkan" : "Link Unit / Pair Device"}
          </Button>
          <Button variant="default" className="rounded-xl px-6" onClick={handleSaveGlobalSettings} disabled={isSyncing}>
            <RefreshCw className={isSyncing ? "animate-spin" : ""} />
            {t("scr.fleetSync")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden rounded-2xl">
            <CardHeader className="border-b bg-muted/30 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <CloudCog className="w-5 h-5 text-accent" />
                    {t("scr.globalOrch")}
                  </CardTitle>
                  <CardDescription>{t("scr.orchDesc")}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-accent text-primary text-[10px] font-bold">
                  {fleet.filter(s => s.status === 'Online').length} {t("scr.activeNodes")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">{t("scr.tickerLabel")}</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ticker" 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder={t("scr.tickerPlaceholder")}
                    className="flex-1 rounded-xl"
                  />
                  <Button variant="secondary" className="rounded-xl px-6" onClick={handleSaveGlobalSettings}>Update</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{t("scr.timezoneLabel")}</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Asia/Jakarta">Jakarta (WIB)</SelectItem>
                      <SelectItem value="Asia/Makassar">Makassar (WITA)</SelectItem>
                      <SelectItem value="Asia/Jayapura">Jayapura (WIT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("scr.playlistLabel")}</Label>
                  <Select value={activePlaylistId} onValueChange={setActivePlaylistId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Playlist" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                   <Button 
                onClick={handleSaveGlobalSettings} 
                className="gap-2 h-11 px-8 rounded-xl bg-primary shadow-lg shadow-primary/20 font-black uppercase tracking-tighter"
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                {isSyncing ? (language === "id-ID" ? "Menyinkronkan..." : "Syncing...") : t("scr.pushGlobal")}
              </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden border-primary/5 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b py-4 px-6">
              <div>
                <CardTitle className="text-lg">{t("scr.inventory")}</CardTitle>
                <CardDescription>{t("scr.inventoryDesc")}</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder={t("scr.searchDevices")} className="bg-transparent text-xs border-none outline-none w-32" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-muted-foreground bg-muted/10 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">{t("scr.panelId")}</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">{t("scr.connectivity")}</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">{t("scr.activeLoop")}</th>
                      <th className="px-6 py-4 text-right font-bold text-[10px] uppercase tracking-widest">{t("med.ops")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleet.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-8 text-muted-foreground">{t("scr.noDevices")}</td>
                      </tr>
                    )}
                    {fleet.map((screen) => {
                      const isDeactivated = screen.status === 'DEACTIVATED';
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
                                "p-2 rounded-xl transition-colors",
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
                            {(() => {
                              const lastSeenDate = screen.lastSeen ? new Date(screen.lastSeen) : null;
                              const isRecent = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000); // 60s threshold
                              
                              let color = "bg-zinc-400"; // Grey (Never)
                              let label = t("scr.statusWaiting");
                              
                              if (isRecent && screen.status !== 'DEACTIVATED' && screen.status !== 'Offline') {
                                color = "bg-emerald-500";
                                label = t("scr.statusActive");
                              } else if (screen.lastSeen) {
                                color = "bg-red-500";
                                label = screen.status === 'DEACTIVATED' ? t("scr.statusDeactivated") : t("scr.statusInactive");
                              }

                              return (
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest min-w-[80px] justify-center rounded-full border-none shadow-sm text-white",
                                    color
                                  )}
                                >
                                  {label}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                            {isDeactivated || isOffline ? t("scr.nodeIdle") : playlists.find(p => p.id === (screen.playlistId || activePlaylistId))?.name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white rounded-xl">
                                  <Settings2 className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-xl border-primary/10">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(screen); }} disabled={isDeactivated} className="rounded-lg py-2">
                                  <Edit className="w-4 h-4 mr-2" /> {t("scr.configNode")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleResetHandshake(screen.id); }} className="rounded-lg py-2">
                                  <RefreshCw className="w-4 h-4 mr-2" /> {t("scr.resetHandshake")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="mx-2 my-1" />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleOnlineStatus(screen.id, screen.status); }} disabled={isDeactivated} className="rounded-lg py-2">
                                  {isOffline ? (
                                    <><Wifi className="w-4 h-4 mr-2 text-emerald-600" /> {t("scr.powerOn")}</>
                                  ) : (
                                    <><WifiOff className="w-4 h-4 mr-2 text-red-600" /> {t("scr.powerOff")}</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleDeactivation(screen); }} className="rounded-lg py-2">
                                  {isDeactivated ? (
                                    <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> {t("scr.reactivate")}</>
                                  ) : (
                                    <><ZapOff className="w-4 h-4 mr-2 text-red-600" /> {t("scr.deactivate")}</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="mx-2 my-1" />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setScreenToDelete(screen.id); }} className="text-red-600 rounded-lg py-2 font-bold">
                                  <Trash2 className="w-4 h-4 mr-2" /> {t("scr.decommission")}
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

        {/* Live Surveillance Feed Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <Card className="shadow-2xl overflow-hidden rounded-2xl border border-primary/10">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-5 px-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const lastSeenDate = selectedScreen?.lastSeen ? new Date(selectedScreen.lastSeen) : null;
                  const isRecent = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000);
                  
                  let statusColor = "bg-zinc-400";
                  if (isRecent && selectedScreen?.status !== 'DEACTIVATED') statusColor = "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                  else if (selectedScreen?.lastSeen) statusColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";

                  return (
                    <div className={cn("w-3 h-3 rounded-full", statusColor)} />
                  );
                })()}
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] leading-none text-primary">{t("scr.telemetryProxy")}</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold bg-white px-3 rounded-lg border-primary/20">
                {selectedScreen?.id || "NO_SIGNAL"}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 relative aspect-video bg-muted/20">
              {previewUrls.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden">
                  {previewUrls.map((url, i) => (
                    <div key={i} className={cn("absolute inset-0 transition-opacity duration-1000", i === previewIndex ? "opacity-100" : "opacity-0")}>
                      {url ? (
                        extractYouTubeId(url) ? (
                          <Image src={`https://img.youtube.com/vi/${extractYouTubeId(url)}/hqdefault.jpg`} alt="Signage View" fill className="object-cover opacity-80" unoptimized />
                        ) : (
                          <Image src={url} alt="Signage View" fill className="object-cover opacity-80" unoptimized />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/80 text-white/20">
                          <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t("common.noData") || "SOURCE_UNAVAILABLE"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1.5 pointer-events-none">
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                      <Signal className="w-3.5 h-3.5 fill-accent animate-pulse" /> {t("scr.broadcasting")}: {selectedScreen?.name}
                    </p>
                    <p className="text-base font-black tracking-tight drop-shadow-lg truncate text-white">
                      {playlists.find(p => p.id === (selectedScreen?.playlistId || activePlaylistId))?.name}
                    </p>
                    <p className="text-[9px] font-mono text-white/60 uppercase tracking-tighter drop-shadow-sm">Status: Active Loop • {t("scr.uptime")}: {selectedScreen?.uptime}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-muted-foreground/40 italic animate-pulse py-20 bg-muted/10">
                  <div className="p-8 rounded-full bg-white/40 border border-white/20 shadow-inner">
                    <Monitor className="w-20 h-20 opacity-30" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-black tracking-[0.3em] uppercase text-primary/40">{t("scr.noActiveLink")}</p>
                    <p className="text-[9px] font-mono opacity-40">WAITING_FOR_HANDSHAKE...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-primary/10 overflow-hidden group rounded-2xl">
            <CardHeader className="pb-4 border-b bg-muted/20 px-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-primary">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                   <Signal className="w-4 h-4" />
                </div>
                {t("scr.healthMatrix")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-5 px-6 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 rounded-xl bg-muted/30 border shadow-sm">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">{t("scr.fleetScan")}</span>
                  <span className="text-sm font-black text-primary font-mono">{scanTime || "--:--:--"}</span>
                </div>
                <div className="flex flex-col p-4 rounded-xl bg-muted/30 border shadow-sm text-right">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">{t("scr.stability")}</span>
                  <span className="text-sm font-black text-emerald-600">
                    {(() => {
                      if (fleet.length === 0) return "100%";
                      const activeCount = fleet.filter(s => {
                        const lastSeenDate = s.lastSeen ? new Date(s.lastSeen) : null;
                        return lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 60000) && s.status !== 'DEACTIVATED' && s.status !== 'Offline';
                      }).length;
                      return `${Math.round((activeCount / fleet.length) * 100)}%`;
                    })()}
                  </span>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground/80 px-1">
                   <span>{t("scr.failures")}</span>
                   <span className="text-red-500 font-black">
                     {fleet.filter(s => {
                        const lastSeenDate = s.lastSeen ? new Date(s.lastSeen) : null;
                        return (lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() >= 60000)) || s.status === 'Offline';
                     }).length} Units
                   </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground/80 px-1">
                   <span>{t("scr.integrity")}</span>
                   <span>{fleet.length > 0 ? "98.2%" : "100%"}</span>
                </div>
                <Progress value={98.2} className="h-1.5 bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configure Node Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{t("scr.configNode")}</DialogTitle>
            <DialogDescription>Modify settings and assigned loops for hardware node {editingScreen?.id}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("scr.nodeLabel")}</Label>
              <Input 
                value={localScreenName} 
                onChange={e => setLocalScreenName(e.target.value)} 
                placeholder="e.g. Science Hall A"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("scr.playlistLabel")}</Label>
              <Select value={localScreenPlaylist} onValueChange={setLocalScreenPlaylist}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Choose a playlist" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {playlists.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isDeploying && (
              <div className="space-y-2 pt-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                  <span>Deploying Assets...</span>
                  <span>{deployProgress}%</span>
                </div>
                <Progress value={deployProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl h-11" disabled={isDeploying}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleUpdateSpecificScreen} 
              className="gap-2 h-11 px-8 rounded-xl bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-tighter"
              disabled={isDeploying}
            >
              {isDeploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isDeploying ? (language === "id-ID" ? "Menerapkan..." : "Deploying...") : t("scr.applyChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linking Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-primary/20 shadow-2xl overflow-hidden p-0">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full -ml-12 -mb-12 blur-2xl" />
             <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter mb-1">{language === "id-ID" ? "PENAUTAN PERANGKAT" : "DEVICE PROVISIONING"}</DialogTitle>
                <DialogDescription className="text-white/70 font-medium">
                  {language === "id-ID" 
                    ? "Sinkronkan hardware baru ke dalam ekosistem FMIPA e-Board." 
                    : "Synchronize new hardware into the FMIPA e-Board ecosystem."}
                </DialogDescription>
             </DialogHeader>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-3xl border border-primary/5 text-center space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{language === "id-ID" ? "KODE PEMASANGAN ANDA" : "YOUR PAIRING CODE"}</p>
                 <div className="flex justify-center gap-3">
                    {(generatedPairCode || "000000").split('').map((char, i) => (
                      <div key={i} className="w-10 h-14 bg-white border-2 border-primary/10 rounded-xl flex items-center justify-center text-2xl font-black text-primary shadow-sm">
                        {char}
                      </div>
                    ))}
                 </div>
                 <p className="text-[9px] text-muted-foreground font-medium italic mt-2">
                   {language === "id-ID" 
                     ? "Masukkan kode ini pada aplikasi layar atau gunakan input di bawah." 
                     : "Enter this code on the screen app or use the input below."}
                 </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">{language === "id-ID" ? "NAMA UNIT" : "UNIT DESIGNATION"}</Label>
                  <Input 
                    value={linkUnitName} 
                    onChange={e => setLinkUnitName(e.target.value)} 
                    placeholder={language === "id-ID" ? "Contoh: Lobi Utama" : "e.g. Grand Lobby Display"}
                    className="rounded-2xl h-14 border-primary/10 bg-muted/30 focus:bg-white transition-all text-lg font-bold px-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">{language === "id-ID" ? "ATAU MASUKKAN KODE KLIEN" : "OR ENTER CLIENT CODE"}</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={pairingCode} 
                      onChange={e => setPairingCode(e.target.value)} 
                      placeholder="685-992"
                      className="rounded-2xl h-14 border-primary/10 bg-muted/30 focus:bg-white transition-all text-center text-xl font-mono tracking-[0.3em]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleLinkNewDevice} 
                className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                disabled={isLinking}
              >
                {isLinking ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <Link2 className="w-5 h-5 mr-3" />
                )}
                {isLinking ? (language === "id-ID" ? "MENAUTKAN..." : "PROVISIONING...") : (language === "id-ID" ? "OTORISASI PERANGKAT" : "AUTHORIZE DEVICE")}
              </Button>
              <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)} className="h-12 rounded-xl text-muted-foreground font-bold">{t("common.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!screenToDelete} onOpenChange={(open) => !open && setScreenToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-red-600">{t("scr.decommissionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scr.decommissionDesc")} ({screenToDelete})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => screenToDelete && handleDeleteDevice(screenToDelete)}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
