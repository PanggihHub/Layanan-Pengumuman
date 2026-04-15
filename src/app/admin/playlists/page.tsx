"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoreVertical, 
  Play, 
  Clock, 
  Layers,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  X,
  Radio,
  Eye,
  Settings,
  CalendarDays,
  Layout,
  LayoutGrid,
  Columns2,
  Rows2,
  ArrowRightCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  ImageOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Playlist, DisplayLayout, MediaItem, PlaylistSchedule, DaySchedule } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn, extractYouTubeId, getMediaThumbnail } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";

// Logic moved to @/lib/utils.ts

import { useLanguage } from "@/context/LanguageContext";

export default function PlaylistsPage() {
  const { t, language } = useLanguage();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  
  // Advanced Multi-Window Schedule
  const DEFAULT_DAY_SCHEDULE = { active: true, windows: [{ start: "00:00", end: "23:59" }] };
  const [weeklySchedule, setWeeklySchedule] = useState<PlaylistSchedule>({
    monday: { ...DEFAULT_DAY_SCHEDULE },
    tuesday: { ...DEFAULT_DAY_SCHEDULE },
    wednesday: { ...DEFAULT_DAY_SCHEDULE },
    thursday: { ...DEFAULT_DAY_SCHEDULE },
    friday: { ...DEFAULT_DAY_SCHEDULE },
    saturday: { ...DEFAULT_DAY_SCHEDULE },
    sunday: { ...DEFAULT_DAY_SCHEDULE },
  });
  
  const [showTicker, setShowTicker] = useState(true);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [showWorship, setShowWorship] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [layout, setLayout] = useState<DisplayLayout>('single');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
      setPlaylists(items);
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
      setMediaItems(items);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        setActivePlaylistId(snapshot.data().activePlaylistId || "");
      }
    });

    return () => {
      unsubPlaylists();
      unsubMedia();
      unsubSettings();
    };
  }, []);

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [playlists, searchQuery]);

  const filteredMediaForSelection = useMemo(() => {
    return mediaItems.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()));
  }, [mediaItems, mediaSearch]);

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    const pl = playlists.find(p => p.id === id);
    if (pl?.isSystem) {
      toast({ 
        title: language === "id-ID" ? "Operasi Ditolak" : "Operation Denied", 
        description: language === "id-ID" ? "Daftar putar default sistem tidak dapat dihapus." :  "System default playlists cannot be deleted.", 
        variant: "destructive" 
      });
      return;
    }
    if (id === activePlaylistId) {
      toast({ 
        title: language === "id-ID" ? "Tidak Dapat Menghapus" : "Cannot Delete", 
        description: language === "id-ID" ? "Beralihlah ke daftar putar lain sebelum menghapus yang aktif." : "Switch to another playlist before deleting the active one.", 
        variant: "destructive" 
      });
      return;
    }

    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "playlists", id));
      toast({ 
        title: language === "id-ID" ? "Daftar Putar Dihapus" : "Playlist Deleted", 
        description: language === "id-ID" ? "Daftar putar dihapus dari sistem." : "Playlist removed from system." 
      });
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Gagal Menghapus" : "Deletion Failed",
        description: language === "id-ID" ? "Kesalahan jaringan. Silakan coba lagi." : "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { activePlaylistId: id }, { merge: true });
      toast({ 
          title: language === "id-ID" ? "Siaran Diperbarui" : "Broadcast Updated", 
          description: language === "id-ID" ? "Urutan baru sekarang ditayangkan." : "New sequence is now live." 
      });
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Pembaruan Gagal" : "Update Failed",
        description: language === "id-ID" ? "Gagal mengaktifkan daftar putar." : "Failed to activate playlist.",
        variant: "destructive"
      });
    }
  };

  const handleSavePlaylist = async () => {
    if (!newName) {
      toast({ 
        title: language === "id-ID" ? "Nama Diperlukan" : "Name Required", 
        description: language === "id-ID" ? "Harap berikan nama daftar putar." : "Please provide a playlist name.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Playlist = {
        id: currentPlaylist?.id || Math.random().toString(36).substr(2, 9),
        name: newName,
        description: newDesc,
        items: selectedMediaIds,
        schedule: newSchedule || null,
        isSystem: currentPlaylist?.isSystem || false,
        showTicker,
        showInfoCard,
        showWorship,
        showQR,
        layout,
        structuredSchedule: weeklySchedule
      };

      await setDoc(doc(db, "playlists", payload.id), payload);

      if (dialogMode === "add") {
        toast({ 
          title: language === "id-ID" ? "Daftar Putar Dibuat" : "Playlist Created", 
          description: language === "id-ID" ? "Urutan baru ditambahkan ke pustaka." : "New sequence added to library." 
        });
      } else if (currentPlaylist) {
        toast({ 
          title: language === "id-ID" ? "Daftar Putar Diperbarui" : "Playlist Updated", 
          description: language === "id-ID" ? "Perubahan disimpan." : "Changes saved." 
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Simpan Gagal" : "Save Failed",
        description: language === "id-ID" ? "Terjadi kesalahan saat menyimpan data." : "An error occurred while saving data.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewDesc("");
    setNewSchedule("");
    setSelectedMediaIds([]);
    setMediaSearch("");
    setShowTicker(true);
    setShowInfoCard(true);
    setShowWorship(true);
    setShowQR(true);
    setLayout('single');
    setWeeklySchedule({
      monday: { ...DEFAULT_DAY_SCHEDULE },
      tuesday: { ...DEFAULT_DAY_SCHEDULE },
      wednesday: { ...DEFAULT_DAY_SCHEDULE },
      thursday: { ...DEFAULT_DAY_SCHEDULE },
      friday: { ...DEFAULT_DAY_SCHEDULE },
      saturday: { ...DEFAULT_DAY_SCHEDULE },
      sunday: { ...DEFAULT_DAY_SCHEDULE },
    });
    setCurrentPlaylist(null);
  };

  const openAddDialog = () => {
    setDialogMode("add");
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (playlist: Playlist) => {
    setDialogMode("edit");
    setCurrentPlaylist(playlist);
    setNewName(playlist.name);
    setNewDesc(playlist.description);
    setNewSchedule(playlist.schedule || "");
    setSelectedMediaIds(playlist.items);
    setShowTicker(playlist.showTicker ?? true);
    setShowInfoCard(playlist.showInfoCard ?? true);
    setShowWorship(playlist.showWorship ?? true);
    setShowQR(playlist.showQR ?? true);
    setLayout(playlist.layout ?? 'single');
    if (playlist.structuredSchedule) {
      setWeeklySchedule(playlist.structuredSchedule);
    }
    setIsDialogOpen(true);
  };

  const openPreview = (playlist: Playlist) => {
    setCurrentPlaylist(playlist);
    setIsPreviewOpen(true);
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getSelectionIndex = (id: string) => {
    const index = selectedMediaIds.indexOf(id);
    return index !== -1 ? index + 1 : null;
  };

  const getLayoutIcon = (l?: DisplayLayout) => {
    switch(l) {
      case 'grid-2x2': return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'split-v': return <Columns2 className="w-3.5 h-3.5" />;
      case 'split-h': return <Rows2 className="w-3.5 h-3.5" />;
      case 'widget-hub': return <Sparkles className="w-3.5 h-3.5" />;
      default: return <Layout className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t("pl.title")}</h1>
          <p className="text-muted-foreground">{t("pl.desc")}</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> {t("pl.create")}
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder={t("pl.filter")} 
          className="bg-transparent border-none outline-none text-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaylists.map((playlist) => {
          const isActive = playlist.id === activePlaylistId;
          const isSystem = playlist.isSystem;
          
          return (
            <Card key={playlist.id} className={cn(
              "group transition-all overflow-hidden flex flex-col border shadow-sm rounded-2xl",
              isActive ? "border-accent ring-2 ring-accent/20 bg-accent/5" : "hover:border-primary/30 hover:shadow-md",
              isSystem && "bg-muted/10 border-dashed border-muted-foreground/30"
            )}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    isActive ? "bg-accent text-primary" : "bg-muted text-muted-foreground",
                    isSystem && "bg-primary/10 text-primary"
                  )}>
                    {isSystem ? <Settings className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>
                  {!isSystem && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/50">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                        <DropdownMenuItem onClick={() => openEditDialog(playlist)} className="rounded-lg gap-2 p-2.5">
                          <Edit2 className="w-4 h-4" /> {t("pl.edit")}
                        </DropdownMenuItem>
                        {!isActive && (
                          <DropdownMenuItem onClick={() => handleActivate(playlist.id)} className="rounded-lg gap-2 p-2.5">
                            <Radio className="w-4 h-4" /> {t("pl.setLive")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(playlist.id)} 
                          className="text-red-600 rounded-lg"
                          disabled={!!isDeleting}
                        >
                          {isDeleting === playlist.id ? (
                            <Plus className="w-4 h-4 mr-2 animate-spin rotate-45" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          {t("pl.deletePlaylist")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isSystem && (
                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest bg-white border-primary/20 text-primary">{t("pl.system")}</Badge>
                  )}
                </div>
                <CardTitle className="mt-4 flex items-center gap-2 text-xl tracking-tight">
                  {playlist.name}
                  {isActive && <Badge className="bg-accent text-primary text-[10px] font-bold border-none">{t("common.active")}</Badge>}
                </CardTitle>
                <CardDescription className="line-clamp-3 min-h-[4.5rem] mt-2 text-sm text-muted-foreground leading-relaxed">
                  {playlist.description || t("pl.noDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-1 pt-2">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-[11px] text-primary/70">
                      <CalendarDays className="w-4 h-4" />
                      <span className="font-black truncate flex items-center gap-1">
                        {playlist.structuredSchedule 
                          ? Object.entries(playlist.structuredSchedule)
                              .filter(([_, data]) => data.active)
                              .map(([day]) => day.substring(0, 2))
                              .join(", ")
                          : t("pl.noSchedule")}
                        <Badge variant="outline" className="ml-1 text-[8px] h-3 px-1">{t("pl.details")}</Badge>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground/80 px-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 opacity-50" />
                      <span>{playlist.items.length} {t("pl.assets")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-50" />
                      <span>{playlist.items.length * 8}s {t("pl.loop")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {playlist.showTicker && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">{t("pl.ticker")}</Badge>}
                  {playlist.showInfoCard && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">{t("pl.infoCards")}</Badge>}
                  {playlist.showWorship && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">{t("pl.worship")}</Badge>}
                  {playlist.showQR && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">{t("pl.qrSync")}</Badge>}
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase gap-1 rounded-md py-0 px-1.5 h-5">
                    {getLayoutIcon(playlist.layout ?? undefined)}
                    {playlist.layout || 'single'}
                  </Badge>
                </div>

                <div className="flex -space-x-3 overflow-hidden py-1">
                  {/* ... avatars ... */}
                </div>
              </CardContent>
              <CardFooter className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openPreview(playlist)}
                  className="gap-2 text-primary hover:bg-primary/10 rounded-lg flex-1 font-bold h-9"
                >
                  <Eye className="w-4 h-4" /> {t("pl.preview")}
                </Button>
                <Button 
                  onClick={() => handleActivate(playlist.id)} 
                  variant={activePlaylistId === playlist.id ? "secondary" : "default"} 
                  className={cn("w-full transition-all duration-300 rounded-xl font-bold", activePlaylistId === playlist.id ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400" : "bg-primary hover:shadow-lg hover:shadow-primary/20")}
                  disabled={activePlaylistId === playlist.id}
                >
                  {activePlaylistId === playlist.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("pl.nowAir")}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {t("pl.pushUpdate")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">{dialogMode === "add" ? t("pl.dialogAdd") : t("pl.dialogEdit")}</DialogTitle>
            <DialogDescription>
              {t("pl.dialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                 <div className="space-y-2">
                  <Label htmlFor="playlist-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("pl.seqTitle")}</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Afternoon Info Loop"
                    className="h-11 rounded-xl"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary">{t("pl.weeklyMatrix")}</Label>
                    <ScrollArea className="h-[280px] pr-4">
                        <div className="space-y-3">
                          {Object.entries(weeklySchedule).map(([day, dayData]) => (
                            <div key={day} className="flex flex-col gap-2 p-3 bg-white border border-primary/10 rounded-xl shadow-sm">
                              <div className="flex items-center justify-between">
                                <Label className="capitalize text-[11px] font-bold text-primary/80">{day}</Label>
                                <Switch 
                                  checked={dayData.active} 
                                  onCheckedChange={(c) => setWeeklySchedule(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day as keyof typeof prev], active: c }
                                  }))} 
                                  disabled={isSaving} 
                                />
                              </div>
                              {dayData.active && dayData.windows.map((w, wIdx) => (
                                <div key={wIdx} className="flex items-center gap-2">
                                  <Input 
                                    type="time" 
                                    value={w.start}
                                    className="h-8 text-xs rounded-lg"
                                    disabled={isSaving}
                                    onChange={(e) => {
                                      const newWindows = [...dayData.windows];
                                      newWindows[wIdx].start = e.target.value;
                                      setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], windows: newWindows }}));
                                    }}
                                  />
                                  <span className="text-muted-foreground/60 text-xs">-</span>
                                  <Input 
                                    type="time" 
                                    value={w.end}
                                    className="h-8 text-xs rounded-lg"
                                    disabled={isSaving}
                                    onChange={(e) => {
                                      const newWindows = [...dayData.windows];
                                      newWindows[wIdx].end = e.target.value;
                                      setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], windows: newWindows }}));
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                    </ScrollArea>
                    <Button 
                      variant="outline" 
                      className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-dashed border-primary/30"
                      onClick={() => {
                        const firstDay = weeklySchedule.monday;
                        setWeeklySchedule({
                          monday: { ...firstDay },
                          tuesday: { ...firstDay },
                          wednesday: { ...firstDay },
                          thursday: { ...firstDay },
                          friday: { ...firstDay },
                          saturday: { ...firstDay },
                          sunday: { ...firstDay },
                        });
                        toast({ 
                          title: language === "id-ID" ? "Sinkronisasi Selesai" : "Sync Complete", 
                          description: language === "id-ID" ? "Jadwal Senin diterapkan ke semua hari." : "Monday's schedule applied to all days." 
                        });
                      }}
                    >
                      {t("pl.applyMonday")}
                    </Button>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("pl.intDesc")}</Label>
                  <Textarea 
                    id="desc" 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                    placeholder={t("pl.descPlaceholder")}
                    className="h-24 rounded-xl resize-none"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-5 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-2">
                  <Layout className="w-5 h-5" /> {t("pl.uiArch")}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary/70">{t("pl.masterLayout")}</Label>
                  <Select value={layout} onValueChange={(v: any) => setLayout(v)} disabled={isSaving}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-primary/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="single">Single Rotation</SelectItem>
                      <SelectItem value="grid-2x2">2x2 Multi-Grid</SelectItem>
                      <SelectItem value="split-v">Split Vertical</SelectItem>
                      <SelectItem value="split-h">Split Horizontal</SelectItem>
                      <SelectItem value="widget-hub">Widget Hub (Dynamic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">{t("pl.ticker")}</Label>
                    <Switch checked={showTicker} onCheckedChange={setShowTicker} disabled={isSaving} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">{t("pl.infoCards")}</Label>
                    <Switch checked={showInfoCard} onCheckedChange={setShowInfoCard} disabled={isSaving} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">{t("pl.worship")}</Label>
                    <Switch checked={showWorship} onCheckedChange={setShowWorship} disabled={isSaving} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">{t("pl.qrSync")}</Label>
                    <Switch checked={showQR} onCheckedChange={setShowQR} disabled={isSaving} />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-primary font-black text-sm uppercase tracking-tight">{t("pl.editor")} ({selectedMediaIds.length})</Label>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("pl.orderDesc")}</p>
                </div>
                <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-2xl border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input 
                    placeholder={t("pl.findAssets")} 
                    className="bg-transparent text-sm border-none outline-none w-48"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-64 border rounded-2xl p-4 bg-muted/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredMediaForSelection.map(media => {
                     const isSelected = selectedMediaIds.includes(media.id);
                     const order = getSelectionIndex(media.id);
                     return (
                       <div 
                         key={media.id}
                         onClick={() => toggleMediaSelection(media.id)}
                         className={cn(
                           "relative group cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-300 aspect-video flex flex-col",
                           isSelected ? "border-primary shadow-md ring-4 ring-primary/10 scale-[0.98]" : "border-transparent hover:border-primary/40 hover:shadow-lg"
                         )}
                       >
                         {isSelected && (
                           <div className="absolute top-2 left-2 z-20 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                             {order}
                           </div>
                         )}
                         <div className="flex-1 bg-black/5 relative w-full h-full overflow-hidden">
                           <Image 
                             src={getMediaThumbnail(media.url, media.type)} 
                             alt={media.name} 
                             fill 
                             className={cn("object-cover transition-transform duration-500", isSelected ? "scale-110 opacity-80" : "group-hover:scale-110")} 
                             unoptimized 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                           <div className="absolute bottom-2 left-3 right-3">
                             <p className="text-white text-[10px] font-bold truncate tracking-wide">{media.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <Badge className="bg-white/20 text-white border-none text-[8px] px-1 py-0! h-3 font-mono">{media.type}</Badge>
                               <span className="text-white/60 text-[8px] font-mono">{media.duration}s</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                  })}
                  {filteredMediaForSelection.length === 0 && (
                    <div className="col-span-full h-32 flex flex-col items-center justify-center text-muted-foreground">
                       <p className="text-sm font-medium">{t("common.noData") || "No media found"}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {selectedMediaIds.length > 0 && (
                <div className="p-5 bg-primary/5 rounded-[2rem] border border-dashed border-primary/30 space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    <Radio className="w-5 h-5 animate-pulse" /> {t("pl.finalOrder")}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 px-2 snap-x">
                    {selectedMediaIds.map((id, index) => {
                      const media = mediaItems.find(m => m.id === id);
                      if (!media) return null;
                      return (
                        <div key={`${id}-${index}`} className="flex items-center gap-3 shrink-0 snap-start group/selected">
                          <div className="w-32 aspect-video bg-black rounded-xl overflow-hidden relative shadow-md ring-1 ring-black/5">
                            <Image src={getMediaThumbnail(media.url, media.type)} alt={media.name} fill className="object-cover opacity-80" unoptimized />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                               <span className="text-xl font-black">{index + 1}</span>
                               <span className="text-[8px] font-mono tracking-widest mt-1 uppercase text-white/70 line-clamp-1 px-2 text-center">{media.name}</span>
                            </div>
                            
                            {/* Reordering Controls */}
                            <div className="absolute inset-0 bg-primary/80 flex items-center justify-center gap-2 opacity-0 group-hover/selected:opacity-100 transition-all duration-300">
                               <Button 
                                 size="icon" 
                                 variant="ghost" 
                                 className="h-8 w-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-primary transition-colors disabled:opacity-30"
                                 disabled={index === 0}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const newItems = [...selectedMediaIds];
                                   [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
                                   setSelectedMediaIds(newItems);
                                 }}
                               >
                                 <ArrowLeft className="w-4 h-4" />
                               </Button>
                               <Button 
                                 size="icon" 
                                 variant="ghost" 
                                 className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   toggleMediaSelection(id);
                                 }}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                               <Button 
                                 size="icon" 
                                 variant="ghost" 
                                 className="h-8 w-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-primary transition-colors disabled:opacity-30"
                                 disabled={index === selectedMediaIds.length - 1}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const newItems = [...selectedMediaIds];
                                   [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
                                   setSelectedMediaIds(newItems);
                                 }}
                               >
                                 <ArrowRight className="w-4 h-4" />
                               </Button>
                            </div>
                          </div>
                          {index < selectedMediaIds.length - 1 && (
                            <ArrowRightCircle className="w-5 h-5 text-primary/40 shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-6 gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6" disabled={isSaving}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleSavePlaylist} 
              className="gap-2 h-12 px-8 rounded-xl bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-tighter"
              disabled={isSaving}
            >
              {isSaving ? (
                <Plus className="w-5 h-5 animate-spin rotate-45" />
              ) : (
                dialogMode === "add" ? <Plus className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
              )}
              {isSaving ? (language === "id-ID" ? "Menyimpan..." : "Saving...") : (dialogMode === "add" ? t("pl.createSeq") : t("common.save"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent 
          className="w-[98vw] h-[98vh] max-w-none max-h-none sm:w-[95vw] sm:h-auto md:w-[90vw] lg:w-[85vw] md:max-w-[calc(85vh*16/9)] md:max-h-[85vh] p-0 overflow-hidden border-none bg-black rounded-none sm:rounded-[2rem] shadow-2xl flex items-center justify-center"
          onPointerDownOutside={(e) => e.preventDefault()}
          showClose={false}
        >
          {/* Decoupled Exit Button - Always on Top */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 group/close pointer-events-auto">
            <Badge className="bg-white/10 text-white/80 border-white/20 backdrop-blur-md px-2 py-1 sm:px-3 text-[9px] sm:text-[10px] font-mono opacity-100 transition-opacity">
              {language === "id-ID" ? "TEKAN ESC UNTUK KELUAR" : "ESC TO EXIT"}
            </Badge>
            <Button 
              variant="secondary" 
              size="icon" 
              className="bg-black/60 text-white hover:bg-black/90 backdrop-blur-xl border border-white/20 sm:border-2 rounded-full h-10 w-10 sm:h-12 sm:w-12 shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-transform hover:scale-110 active:scale-90"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="w-5 h-5 sm:w-7 sm:h-7" />
            </Button>
          </div>
          <DialogHeader className="sr-only">
            <DialogTitle>Broadcast Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full group">
            <Carousel 
              key={`${currentPlaylist?.id}-${isPreviewOpen}`} // Force refresh on open
              className="w-full h-full aspect-video"
              opts={{
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 8000,
                  stopOnInteraction: false,
                })
              ]}
            >
              <CarouselContent>
                {currentPlaylist?.items.map((itemId, index) => {
                  const media = mediaItems.find(m => m.id === itemId);
                  const youtubeId = media ? extractYouTubeId(media.url) : null;
                  
                  return (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video w-full flex items-center justify-center bg-black overflow-hidden">
                        {media ? (
                           youtubeId ? (
                            <iframe 
                              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&vq=hd1080`}
                              className="w-full h-full border-none pointer-events-none"
                              allow="autoplay; fullscreen"
                            />
                          ) : media.type === 'website' ? (
                            <iframe src={media.url} className="w-full h-full border-none pointer-events-none" />
                          ) : (
                            <div className="relative w-full h-full">
                              <Image 
                                src={getMediaThumbnail(media.url, media.type)} 
                                alt={media.name} 
                                fill 
                                className="object-cover opacity-80 blur-2xl scale-110" 
                                unoptimized 
                              />
                              <Image 
                                src={getMediaThumbnail(media.url, media.type)} 
                                alt={media.name} 
                                fill 
                                className="object-contain relative z-10 drop-shadow-2xl" 
                                unoptimized 
                              />
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/50 gap-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative group/icon">
                               <ImageOff className="w-10 h-10 sm:w-16 sm:h-16 opacity-30 group-hover/icon:scale-110 transition-transform" />
                               <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-2xl animate-pulse" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                               <p className="text-xs sm:text-base font-black tracking-[0.3em] uppercase bg-gradient-to-r from-white/40 to-white/60 bg-clip-text text-transparent">{language === "id-ID" ? "Sumber Tidak Dirender" : "Source Not Rendered"}</p>
                               <Badge variant="outline" className="text-[8px] font-mono border-white/10 text-white/30 uppercase">{language === "id-ID" ? "VERIFIKASI URL ATAU FORMAT" : "VERIFY URL OR FORMAT"}</Badge>
                            </div>
                          </div>
                        )}
                        {/* Enhanced Top Status Bar */}
                        <div className="absolute inset-x-0 top-0 p-4 pt-4 sm:p-8 sm:pt-10 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none z-20">
                           <div className="flex items-start justify-between">
                            <div className="max-w-xl">
                              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                  <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-accent/90 backdrop-blur-sm text-primary rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest animate-pulse border border-white/20 shadow-[0_0_15px_rgba(var(--accent),0.3)]">
                                    LIVE PREVIEW
                                  </div>
                                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Asset {index + 1} of {currentPlaylist?.items?.length || 0}</p>
                              </div>
                              <h4 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-none uppercase text-white drop-shadow-2xl line-clamp-1">{media?.name}</h4>
                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/10 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                    {media?.type}
                                  </Badge>
                                </div>
                                <Separator orientation="vertical" className="h-3 bg-white/10" />
                                <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                                  <Clock className="w-3.5 h-3.5" /> 8S Sequence
                                </div>
                              </div>
                            </div>
                           </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              
              {/* Manual Nav Controls */}
              <div className="absolute inset-y-0 left-0 flex items-center justify-center p-4 sm:p-8 z-30 pointer-events-none">
                <CarouselPrevious className="relative left-0 bg-black/40 border-white/20 text-white hover:bg-black/60 h-10 w-10 sm:h-16 sm:w-16 rounded-full sm:rounded-[2rem] backdrop-blur-xl hover:scale-110 transition-all pointer-events-auto border sm:border-2 shadow-2xl" />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center justify-center p-4 sm:p-8 z-30 pointer-events-none">
                <CarouselNext className="relative right-0 bg-black/40 border-white/20 text-white hover:bg-black/60 h-10 w-10 sm:h-16 sm:w-16 rounded-full sm:rounded-[2rem] backdrop-blur-xl hover:scale-110 transition-all pointer-events-auto border sm:border-2 shadow-2xl" />
              </div>
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}