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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle
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
import { Playlist, DisplayLayout, MediaItem } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn, extractYouTubeId, getMediaThumbnail } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";

// Logic moved to @/lib/utils.ts

export default function PlaylistsPage() {
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

  useEffect(() => {
    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snapshot) => {
      const items: Playlist[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as Playlist));
      setPlaylists(items);
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snapshot) => {
      const items: MediaItem[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as MediaItem));
      setMediaItems(items);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setActivePlaylistId(docSnapshot.data().activePlaylistId || "");
      }
    });

    // System Initialization: Logic to ensure default content exists
    const initializeSystemContent = async () => {
      // 1. Check/Create Default Widgets
      const widgets = [
        { id: 'w-clock', name: 'Digital Clock Widget', type: 'clock' as const, source: 'internal' as const, size: '0.1 MB', date: new Date().toISOString().split('T')[0], url: 'widget://clock', category: 'campus' as const, description: 'System-wide digital clock with date overlay.' },
        { id: 'w-weather', name: 'Smart Weather Widget', type: 'weather' as const, source: 'internal' as const, size: '0.2 MB', date: new Date().toISOString().split('T')[0], url: 'widget://weather', category: 'science' as const, description: 'Real-time weather forecast and temperature display.' }
      ];

      for (const widget of widgets) {
        const widgetRef = doc(db, "media", widget.id);
        const widgetSnap = await getDoc(widgetRef);
        if (!widgetSnap.exists()) {
          await setDoc(widgetRef, widget);
        }
      }

      // 2. Check/Create Default Playlist
      const defaultId = "default-info-hub";
      const playlistRef = doc(db, "playlists", defaultId);
      const playlistSnap = await getDoc(playlistRef);
      if (!playlistSnap.exists()) {
        const defaultPlaylist: Playlist = {
          id: defaultId,
          name: "Default Info Hub (Clock & Weather)",
          description: "Initial system playlist containing Clock and Weather widgets. Automatically active if no other content is set.",
          items: ['w-clock', 'w-weather'],
          isSystem: true,
          showTicker: true,
          showInfoCard: true,
          showWorship: true,
          showQR: true,
          layout: 'split-h',
          structuredSchedule: {
            monday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            tuesday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            wednesday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            thursday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            friday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            saturday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
            sunday: { active: true, windows: [{ start: "00:00", end: "23:59" }] },
          }
        };
        await setDoc(playlistRef, defaultPlaylist);
        
        // Ensure this is set as the active playlist if none exists
        const settingsRef = doc(db, "settings", "global");
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists() || !settingsSnap.data().activePlaylistId) {
          await setDoc(settingsRef, { activePlaylistId: defaultId }, { merge: true });
        }
      }
    };

    initializeSystemContent();

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
    const pl = playlists.find(p => p.id === id);
    if (pl?.isSystem) {
      toast({ title: "Operation Denied", description: "System default playlists cannot be deleted.", variant: "destructive" });
      return;
    }
    if (id === activePlaylistId) {
      toast({ title: "Cannot Delete", description: "Switch to another playlist before deleting the active one.", variant: "destructive" });
      return;
    }
    await deleteDoc(doc(db, "playlists", id));
    toast({ title: "Playlist Deleted", description: "Playlist removed from system." });
  };

  const handleActivate = async (id: string) => {
    await setDoc(doc(db, "settings", "global"), { activePlaylistId: id }, { merge: true });
    toast({ title: "Broadcast Updated", description: "New sequence is now live." });
  };

  const handleSavePlaylist = async () => {
    if (!newName) {
      toast({ title: "Name Required", description: "Please provide a playlist name.", variant: "destructive" });
      return;
    }

    const payload: Playlist = {
      id: currentPlaylist?.id || Math.random().toString(36).substr(2, 9),
      name: newName,
      description: newDesc,
      items: selectedMediaIds,
      showTicker,
      showInfoCard,
      showWorship,
      showQR,
      layout,
      structuredSchedule: weeklySchedule
    };

    await setDoc(doc(db, "playlists", payload.id), payload);

    if (dialogMode === "add") {
      toast({ title: "Playlist Created", description: "New sequence added to library." });
    } else if (currentPlaylist) {
      toast({ title: "Playlist Updated", description: "Changes saved." });
    }

    setIsDialogOpen(false);
    resetForm();
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
    setScheduledDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
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
          <h1 className="text-3xl font-bold text-primary">Content Playlists</h1>
          <p className="text-muted-foreground">Manage sequences and schedule your broadcast library.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Create Sequence
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Filter sequences..." 
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
                          <Edit2 className="w-4 h-4" /> Edit Sequence
                        </DropdownMenuItem>
                        {!isActive && (
                          <DropdownMenuItem onClick={() => handleActivate(playlist.id)} className="rounded-lg gap-2 p-2.5">
                            <Radio className="w-4 h-4" /> Set Live
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(playlist.id)} className="text-red-600 rounded-lg gap-2 p-2.5">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isSystem && (
                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest bg-white border-primary/20 text-primary">SYSTEM</Badge>
                  )}
                </div>
                <CardTitle className="mt-4 flex items-center gap-2 text-xl tracking-tight">
                  {playlist.name}
                  {isActive && <Badge className="bg-accent text-primary text-[10px] font-bold border-none">ACTIVE</Badge>}
                </CardTitle>
                <CardDescription className="line-clamp-3 min-h-[4.5rem] mt-2 text-sm text-muted-foreground leading-relaxed">
                  {playlist.description || "No internal description provided for this sequence loop."}
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
                          : "No active schedule"}
                        <Badge variant="outline" className="ml-1 text-[8px] h-3 px-1">DETAILS</Badge>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground/80 px-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 opacity-50" />
                      <span>{playlist.items.length} Assets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-50" />
                      <span>{playlist.items.length * 8}s Loop</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {playlist.showTicker && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">Ticker</Badge>}
                  {playlist.showInfoCard && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">Info</Badge>}
                  {playlist.showWorship && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">Worship</Badge>}
                  {playlist.showQR && <Badge variant="secondary" className="text-[9px] rounded-md py-0 px-1.5 h-5">QR</Badge>}
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase gap-1 rounded-md py-0 px-1.5 h-5">
                    {getLayoutIcon(playlist.layout)}
                    {playlist.layout || 'single'}
                  </Badge>
                </div>

                <div className="flex -space-x-3 overflow-hidden py-1">
                  {playlist.items.slice(0, 5).map((itemId, i) => {
                    const media = mediaItems.find(m => m.id === itemId);
                    return (
                      <div key={i} className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-muted overflow-hidden relative shadow-sm">
                        {media ? (
                          <Image src={getMediaThumbnail(media.url, media.type)} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[8px]">?</div>
                        )}
                      </div>
                    );
                  })}
                  {playlist.items.length > 5 && (
                    <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-primary text-white flex items-center justify-center text-[11px] font-black shadow-sm">
                      +{playlist.items.length - 5}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openPreview(playlist)}
                  className="gap-2 text-primary hover:bg-primary/10 rounded-lg flex-1 font-bold h-9"
                >
                  <Eye className="w-4 h-4" /> Preview
                </Button>
                {isActive ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] h-9 px-4 rounded-lg flex-1 justify-center">LIVE FEED</Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleActivate(playlist.id)}
                    className="flex-1 text-[11px] h-9 border-accent text-primary hover:bg-accent/20 rounded-lg font-black uppercase tracking-tighter"
                  >
                    Set Live
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">{dialogMode === "add" ? "Create New Sequence" : "Modify Sequence"}</DialogTitle>
            <DialogDescription>
              Configure sequence name, broadcast schedule, and display overlays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                 <div className="space-y-2">
                  <Label htmlFor="playlist-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sequence Title</Label>
                  <Input 
                    id="playlist-name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Afternoon Info Loop"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-4">

                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Weekly Broadcast Matrix</Label>
                    <ScrollArea className="h-[280px] pr-4">
                      <div className="space-y-3">
                        {Object.entries(weeklySchedule).map(([day, data]) => (
                          <div key={day} className={cn(
                            "p-3 rounded-2xl border transition-all",
                            data.active ? "bg-white border-primary/20 shadow-sm" : "bg-muted/50 opacity-60"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={data.active} 
                                  onCheckedChange={(val) => setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof PlaylistSchedule], active: val } }))} 
                                />
                                <span className="text-xs font-black uppercase tracking-tight">{day}</span>
                              </div>
                              {data.active && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[9px] font-bold uppercase tracking-widest text-primary"
                                  onClick={() => setWeeklySchedule(prev => ({
                                    ...prev,
                                    [day]: { 
                                      ...prev[day as keyof PlaylistSchedule], 
                                      windows: [...prev[day as keyof PlaylistSchedule].windows, { start: "09:00", end: "17:00" }] 
                                    }
                                  }))}
                                >
                                  <PlusCircle className="w-3 h-3 mr-1" /> Add Window
                                </Button>
                              )}
                            </div>
                            
                            {data.active && (
                              <div className="space-y-2">
                                {data.windows.map((window, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                      <Input 
                                        type="time" 
                                        value={window.start} 
                                        onChange={(e) => {
                                          const newWindows = [...data.windows];
                                          newWindows[idx].start = e.target.value;
                                          setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof PlaylistSchedule], windows: newWindows } }));
                                        }}
                                        className="h-8 text-[11px] rounded-lg"
                                      />
                                      <Input 
                                        type="time" 
                                        value={window.end} 
                                        onChange={(e) => {
                                          const newWindows = [...data.windows];
                                          newWindows[idx].end = e.target.value;
                                          setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof PlaylistSchedule], windows: newWindows } }));
                                        }}
                                        className="h-8 text-[11px] rounded-lg"
                                      />
                                    </div>
                                    {data.windows.length > 1 && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                          const newWindows = data.windows.filter((_, i) => i !== idx);
                                          setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof PlaylistSchedule], windows: newWindows } }));
                                        }}
                                      >
                                        <MinusCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
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
                        toast({ title: "Sync Complete", description: "Monday's schedule applied to all days." });
                      }}
                    >
                      Apply Monday To All days
                    </Button>
                  </div>
iv>
                <div className="space-y-2">
                  <Label htmlFor="playlist-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal Description</Label>
                  <Textarea 
                    id="playlist-desc" 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                    placeholder="Describe the purpose of this sequence..."
                    className="h-24 rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="space-y-5 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-2">
                  <Layout className="w-5 h-5" /> UI Architecture
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary/70">Master Screen Layout</Label>
                  <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
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
                    <Label className="text-[11px] font-bold text-primary/80">Ticker</Label>
                    <Switch checked={showTicker} onCheckedChange={setShowTicker} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">Info Cards</Label>
                    <Switch checked={showInfoCard} onCheckedChange={setShowInfoCard} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">Worship</Label>
                    <Switch checked={showWorship} onCheckedChange={setShowWorship} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
                    <Label className="text-[11px] font-bold text-primary/80">QR Sync</Label>
                    <Switch checked={showQR} onCheckedChange={setShowQR} />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-primary font-black text-sm uppercase tracking-tight">Loop Sequence Editor ({selectedMediaIds.length})</Label>
                  <p className="text-[11px] text-muted-foreground mt-1">Order is preserved based on selection. Tap items to toggle.</p>
                </div>
                <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-2xl border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input 
                    placeholder="Find media assets..." 
                    className="bg-transparent text-sm border-none outline-none w-48"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[350px] rounded-3xl border p-5 bg-muted/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMediaForSelection.map((item) => {
                    const selIndex = getSelectionIndex(item.id);
                    const isSelected = !!selIndex;

                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex flex-col gap-2 p-3 rounded-2xl border bg-white transition-all cursor-pointer relative group",
                          isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "hover:border-primary/40 hover:shadow-lg"
                        )}
                        onClick={() => toggleMediaSelection(item.id)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-black z-20 shadow-xl border-2 border-white animate-in zoom-in-75">
                            {selIndex}
                          </div>
                        )}
                        <div className={cn(
                          "relative aspect-video w-full rounded-xl overflow-hidden bg-muted border-2 transition-all",
                          isSelected ? "border-primary" : "border-transparent"
                        )}>
                          <Image src={getMediaThumbnail(item.url, item.type)} alt={item.name} fill className="object-cover" unoptimized />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 pointer-events-none flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black truncate text-primary/80">{item.name}</p>
                          <div className="flex items-center justify-between mt-1 opacity-60">
                            <p className="text-[10px] uppercase font-bold tracking-widest">{item.type}</p>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              {selectedMediaIds.length > 0 && (
                <div className="p-5 bg-primary/5 rounded-[2rem] border border-dashed border-primary/30 space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    <Radio className="w-5 h-5 animate-pulse" /> Final Playback Order
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedMediaIds.map((id, idx) => {
                      const media = mediaItems.find(m => m.id === id);
                      return (
                        <div key={idx} className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border shadow-sm text-xs font-bold hover:scale-105 transition-transform">
                          <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <span className="max-w-[140px] truncate">{media?.name}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleMediaSelection(id); }}
                            className="text-muted-foreground hover:text-red-500 ml-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
            <Button onClick={handleSavePlaylist} className="gap-2 h-12 px-10 rounded-xl bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-tighter">
              {dialogMode === "add" ? <Plus className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              {dialogMode === "add" ? "Create Sequence" : "Push Updates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border-none bg-black rounded-[2rem] relative shadow-2xl">
          {/* Decoupled Exit Button - Always on Top */}
          <div className="absolute top-6 right-6 z-[100] flex items-center gap-2 group/close pointer-events-auto">
            <Badge className="bg-white/10 text-white/80 border-white/20 backdrop-blur-md px-3 py-1 font-mono text-[10px] opacity-0 group-hover/close:opacity-100 transition-opacity">ESC TO EXIT</Badge>
            <Button 
              variant="secondary" 
              size="icon" 
              className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-xl border-2 border-white/20 rounded-full h-12 w-12 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-transform hover:scale-110"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="w-7 h-7" />
            </Button>
          </div>
          <DialogHeader className="sr-only">
            <DialogTitle>Broadcast Preview</DialogTitle>
          </DialogHeader>
          <div className="relative group">
            <Carousel 
              key={`${currentPlaylist?.id}-${isPreviewOpen}`} // Force refresh on open
              className="w-full"
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
                          <p className="text-white opacity-50">Media Unavailable</p>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-20">
                           <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 bg-accent text-primary rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                  LIVE PREVIEW
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Asset {index + 1} of {currentPlaylist.items.length}</p>
                            </div>
                            <h4 className="text-5xl font-black tracking-tighter leading-none uppercase text-white drop-shadow-2xl">{media?.name}</h4>
                            <div className="flex items-center gap-6 mt-6">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                  {media?.type}
                                </Badge>
                              </div>
                              <Separator orientation="vertical" className="h-4 bg-white/20" />
                              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                <Clock className="w-4 h-4" /> 8S Sequence
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
              <div className="absolute inset-y-0 left-0 flex items-center justify-center p-8 z-30 pointer-events-none">
                <CarouselPrevious className="relative left-0 bg-black/40 border-white/20 text-white hover:bg-black/60 h-16 w-16 rounded-[2rem] backdrop-blur-xl hover:scale-110 transition-all pointer-events-auto border-2 shadow-2xl" />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center justify-center p-8 z-30 pointer-events-none">
                <CarouselNext className="relative right-0 bg-black/40 border-white/20 text-white hover:bg-black/60 h-16 w-16 rounded-[2rem] backdrop-blur-xl hover:scale-110 transition-all pointer-events-auto border-2 shadow-2xl" />
              </div>
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}