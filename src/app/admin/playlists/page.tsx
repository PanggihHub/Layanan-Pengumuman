
"use client";

import { useState, useMemo } from "react";
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
  ArrowRightCircle
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PLAYLISTS, INITIAL_MEDIA, SCREEN_SETTINGS, Playlist, DisplayLayout } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLISTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState(SCREEN_SETTINGS.activePlaylistId);
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

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [playlists, searchQuery]);

  const filteredMediaForSelection = useMemo(() => {
    return INITIAL_MEDIA.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()));
  }, [mediaSearch]);

  const handleDelete = (id: string) => {
    const pl = playlists.find(p => p.id === id);
    if (pl?.isSystem) {
      toast({ title: "Operation Denied", description: "System default playlists cannot be deleted.", variant: "destructive" });
      return;
    }
    if (id === activePlaylistId) {
      toast({ title: "Cannot Delete", description: "Switch to another playlist before deleting the active one.", variant: "destructive" });
      return;
    }
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast({ title: "Playlist Deleted", description: "Playlist removed from system." });
  };

  const handleActivate = (id: string) => {
    setActivePlaylistId(id);
    toast({ title: "Broadcast Updated", description: "New sequence is now live." });
  };

  const handleSavePlaylist = () => {
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

    if (dialogMode === "add") {
      setPlaylists(prev => [payload, ...prev]);
      toast({ title: "Playlist Created", description: "New sequence added to library." });
    } else if (currentPlaylist) {
      setPlaylists(prev => prev.map(p => p.id === currentPlaylist.id ? payload : p));
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
        <Button onClick={openAddDialog} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> Create Sequence
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm">
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
              "group transition-all overflow-hidden flex flex-col border-2",
              isActive ? "border-accent ring-4 ring-accent/5 bg-accent/5" : "border-transparent hover:border-primary/20",
              isSystem && "bg-muted/10 border-dashed border-muted-foreground/30"
            )}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-accent text-primary" : "bg-muted text-muted-foreground",
                    isSystem && "bg-primary/10 text-primary"
                  )}>
                    {isSystem ? <Settings className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>
                  {!isSystem && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(playlist)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit sequence
                        </DropdownMenuItem>
                        {!isActive && (
                          <DropdownMenuItem onClick={() => handleActivate(playlist.id)}>
                            <Radio className="w-4 h-4 mr-2" /> Activate Loop
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(playlist.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isSystem && (
                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest bg-white">PROTECTED</Badge>
                  )}
                </div>
                <CardTitle className="mt-4 flex items-center gap-2">
                  {playlist.name}
                  {isActive && <Badge className="bg-accent text-primary text-[10px] font-bold">LIVE</Badge>}
                </CardTitle>
                <CardDescription className="line-clamp-3 min-h-[4.5rem] mt-2 text-sm text-muted-foreground">
                  {playlist.description || "No internal description provided for this sequence loop."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2 rounded-md border border-dashed">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium truncate">{playlist.schedule || "No schedule set"}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{playlist.items.length} items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{playlist.items.length * 8}s cycle</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 items-center">
                  {playlist.showTicker && <Badge variant="secondary" className="text-[8px]">Ticker</Badge>}
                  {playlist.showInfoCard && <Badge variant="secondary" className="text-[8px]">Info</Badge>}
                  {playlist.showWorship && <Badge variant="secondary" className="text-[8px]">Worship</Badge>}
                  {playlist.showQR && <Badge variant="secondary" className="text-[8px]">QR</Badge>}
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] uppercase gap-1">
                    {getLayoutIcon(playlist.layout)}
                    {playlist.layout || 'single'}
                  </Badge>
                </div>

                <div className="flex -space-x-2 overflow-hidden py-1 px-1">
                  {playlist.items.slice(0, 4).map((itemId, i) => {
                    const media = INITIAL_MEDIA.find(m => m.id === itemId);
                    return (
                      <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-muted overflow-hidden relative">
                        {media ? (
                          <Image src={media.url} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[8px]">?</div>
                        )}
                      </div>
                    );
                  })}
                  {playlist.items.length > 4 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                      +{playlist.items.length - 4}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openPreview(playlist)}
                  className="gap-2 text-primary hover:bg-primary/5"
                >
                  <Eye className="w-3.5 h-3.5" /> Quick Preview
                </Button>
                {isActive ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">In Use</Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleActivate(playlist.id)}
                    className="text-xs h-8 border-accent text-primary hover:bg-accent/10"
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "New Sequence" : "Modify Sequence"}</DialogTitle>
            <DialogDescription>
              Configure sequence name, broadcast schedule, and display overlays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="playlist-name">Sequence Title</Label>
                  <Input 
                    id="playlist-name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Afternoon Info Loop"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist-schedule">Broadcast Window (Schedule)</Label>
                  <Input 
                    id="playlist-schedule" 
                    value={newSchedule} 
                    onChange={(e) => setNewSchedule(e.target.value)} 
                    placeholder="e.g. Mon-Fri, 08:00 - 18:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist-desc">Internal Description</Label>
                  <Textarea 
                    id="playlist-desc" 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                    placeholder="e.g. For library screens only"
                    className="h-20"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-2">
                  <Layout className="w-4 h-4" /> Display Overlay & Layout
                </div>
                
                <div className="space-y-2">
                  <Label>Screen Layout</Label>
                  <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Rotation</SelectItem>
                      <SelectItem value="grid-2x2">2x2 Grid</SelectItem>
                      <SelectItem value="split-v">Split Vertical</SelectItem>
                      <SelectItem value="split-h">Split Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                    <Label className="text-[10px] font-bold">Bottom Ticker</Label>
                    <Switch checked={showTicker} onCheckedChange={setShowTicker} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                    <Label className="text-[10px] font-bold">Info Overlays</Label>
                    <Switch checked={showInfoCard} onCheckedChange={setShowInfoCard} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                    <Label className="text-[10px] font-bold">Worship Widget</Label>
                    <Switch checked={showWorship} onCheckedChange={setShowWorship} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                    <Label className="text-[10px] font-bold">Interactive QR</Label>
                    <Switch checked={showQR} onCheckedChange={setShowQR} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-primary font-bold">Sequential Media Selection ({selectedMediaIds.length})</Label>
                  <p className="text-[10px] text-muted-foreground italic mt-0.5">Selection order is strictly preserved. Click to add/remove.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Find media..." 
                    className="w-48 h-8 text-xs"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredMediaForSelection.map((item) => {
                    const selIndex = getSelectionIndex(item.id);
                    const isSelected = !!selIndex;

                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex flex-col gap-2 p-3 rounded-lg border bg-white transition-all cursor-pointer relative group",
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/30"
                        )}
                        onClick={() => toggleMediaSelection(item.id)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black z-20 shadow-lg border-2 border-white animate-in zoom-in-50">
                            {selIndex}
                          </div>
                        )}
                        <div className={cn(
                          "relative aspect-video w-full rounded-md overflow-hidden bg-muted border-2 transition-colors",
                          isSelected ? "border-primary" : "border-transparent"
                        )}>
                          <Image src={item.url} alt={item.name} fill className="object-cover" unoptimized />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{item.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[9px] text-muted-foreground uppercase">{item.type}</p>
                            {isSelected && <ArrowRightCircle className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              {selectedMediaIds.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Radio className="w-4 h-4 animate-pulse" /> Live Loop Sequence
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMediaIds.map((id, idx) => {
                      const media = INITIAL_MEDIA.find(m => m.id === id);
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs font-bold animate-in slide-in-from-left-2">
                          <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <span className="max-w-[120px] truncate">{media?.name}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleMediaSelection(id); }}
                            className="text-muted-foreground hover:text-red-500 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlaylist} className="gap-2 px-8">
              {dialogMode === "add" ? <Plus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {dialogMode === "add" ? "Create Sequence" : "Confirm Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-black">
          <DialogHeader className="sr-only">
            <DialogTitle>Playlist Preview: {currentPlaylist?.name}</DialogTitle>
            <DialogDescription>Previewing the media loop for the {currentPlaylist?.name} sequence.</DialogDescription>
          </DialogHeader>
          <div className="relative group">
            <Carousel className="w-full">
              <CarouselContent>
                {currentPlaylist?.items.map((itemId, index) => {
                  const media = INITIAL_MEDIA.find(m => m.id === itemId);
                  return (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                        {media ? (
                          <Image 
                            src={media.url} 
                            alt={media.name} 
                            fill 
                            className="object-contain" 
                            unoptimized 
                          />
                        ) : (
                          <p className="text-white opacity-50">Media Unavailable</p>
                        )}
                        <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-xl text-white border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Sequence Step {index + 1} of {currentPlaylist.items.length}</p>
                          </div>
                          <h4 className="text-2xl font-black tracking-tight">{media?.name}</h4>
                          <p className="text-xs text-white/60 mt-1 uppercase font-bold tracking-widest">{media?.type} • Standard Duration</p>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
              <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
