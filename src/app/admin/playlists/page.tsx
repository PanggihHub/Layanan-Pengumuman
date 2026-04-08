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
  Sparkles
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

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
      schedule: newSchedule,
      items: selectedMediaIds,
      showTicker,
      showInfoCard,
      showWorship,
      showQR,
      layout,
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
                  <div className="flex items-center gap-2 text-[11px] text-primary/70 bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-bold truncate">{playlist.schedule || "No schedule set"}</span>
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
                          media.source === "external" && media.url.includes("youtube") ? (
                            <Image src={`https://img.youtube.com/vi/${new URL(media.url).searchParams.get('v')}/0.jpg`} alt="" fill className="object-cover" unoptimized/>
                          ) : (
                            <Image src={media.url || 'https://picsum.photos/seed/placeholder/1920/1080'} alt="" fill className="object-cover" unoptimized />
                          )
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
                <div className="space-y-2">
                  <Label htmlFor="playlist-schedule" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Broadcast Window</Label>
                  <Input 
                    id="playlist-schedule" 
                    value={newSchedule} 
                    onChange={(e) => setNewSchedule(e.target.value)} 
                    placeholder="e.g. Mon-Fri, 08:00 - 18:00"
                    className="h-11 rounded-xl"
                  />
                </div>
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
                          {item.source === "external" && item.url.includes("youtube") ? (
                            <Image src={`https://img.youtube.com/vi/${new URL(item.url).searchParams.get('v')}/0.jpg`} alt={item.name} fill className="object-cover" unoptimized/>
                          ) : (
                            <Image src={item.url || 'https://picsum.photos/seed/placeholder/1920/1080'} alt={item.name} fill className="object-cover" unoptimized />
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
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
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-black rounded-[2rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="relative group">
            <Carousel className="w-full">
              <CarouselContent>
                {currentPlaylist?.items.map((itemId, index) => {
                  const media = mediaItems.find(m => m.id === itemId);
                  return (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                        {media ? (
                           media.source === "external" && media.url.includes("youtube") ? (
                            <Image src={`https://img.youtube.com/vi/${new URL(media.url).searchParams.get('v')}/0.jpg`} alt={media.name} fill className="object-cover" unoptimized/>
                          ) : (
                            <Image 
                              src={media.url || 'https://picsum.photos/seed/placeholder/1920/1080'} 
                              alt={media.name} 
                              fill 
                              className="object-contain" 
                              unoptimized 
                            />
                          )
                        ) : (
                          <p className="text-white opacity-50">Media Unavailable</p>
                        )}
                        <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/40 backdrop-blur-2xl rounded-3xl text-white border border-white/10 shadow-2xl">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
                             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-accent">Sequence {index + 1} • {currentPlaylist.items.length}</p>
                          </div>
                          <h4 className="text-3xl font-black tracking-tight leading-none">{media?.name}</h4>
                          <div className="flex items-center gap-4 mt-3 opacity-60">
                            <span className="text-[10px] uppercase font-bold tracking-widest">{media?.type}</span>
                            <Separator orientation="vertical" className="h-3 bg-white/20" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">8 Second Exposure</span>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-6 bg-white/10 border-white/20 text-white hover:bg-white/30 h-12 w-12" />
              <CarouselNext className="right-6 bg-white/10 border-white/20 text-white hover:bg-white/30 h-12 w-12" />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}