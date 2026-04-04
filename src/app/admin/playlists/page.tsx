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
  Copy,
  Search,
  CheckCircle2,
  X,
  Radio
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { PLAYLISTS, INITIAL_MEDIA, SCREEN_SETTINGS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Playlist {
  id: string;
  name: string;
  items: string[];
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLISTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState(SCREEN_SETTINGS.activePlaylistId);
  const { toast } = useToast();

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [playlists, searchQuery]);

  const filteredMediaForSelection = useMemo(() => {
    return INITIAL_MEDIA.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()));
  }, [mediaSearch]);

  const handleDelete = (id: string) => {
    if (id === activePlaylistId) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete the active playlist. Switch to another one first.",
        variant: "destructive"
      });
      return;
    }
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Playlist Deleted",
      description: "The playlist has been removed from the system.",
    });
  };

  const handleActivate = (id: string) => {
    setActivePlaylistId(id);
    toast({
      title: "Playlist Activated",
      description: "The selected loop is now live on connected displays.",
    });
  };

  const handleSavePlaylist = () => {
    if (!newName) {
      toast({ title: "Name Required", description: "Please provide a name for the playlist.", variant: "destructive" });
      return;
    }
    if (selectedMediaIds.length === 0) {
      toast({ title: "Media Required", description: "Select at least one media item.", variant: "destructive" });
      return;
    }

    if (dialogMode === "add") {
      const newPlaylist: Playlist = {
        id: Math.random().toString(36).substr(2, 9),
        name: newName,
        items: selectedMediaIds,
      };
      setPlaylists(prev => [newPlaylist, ...prev]);
      toast({ title: "Playlist Created", description: `${newName} is now available.` });
    } else if (currentPlaylist) {
      setPlaylists(prev => prev.map(p => 
        p.id === currentPlaylist.id ? { ...p, name: newName, items: selectedMediaIds } : p
      ));
      toast({ title: "Playlist Updated", description: "Changes saved successfully." });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setSelectedMediaIds([]);
    setMediaSearch("");
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
    setSelectedMediaIds(playlist.items);
    setIsDialogOpen(true);
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Playlists</h1>
          <p className="text-muted-foreground">Organize your media into timed sequences for broadcast.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> Create Playlist
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search playlists..." 
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
          const duration = playlist.items.length * 8;
          const isActive = playlist.id === activePlaylistId;
          
          return (
            <Card key={playlist.id} className={cn(
              "group transition-all overflow-hidden flex flex-col border-2",
              isActive ? "border-accent ring-4 ring-accent/10" : "border-transparent hover:border-muted-foreground/20"
            )}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-accent/20" : "bg-muted"
                  )}>
                    <Layers className={cn("w-6 h-6", isActive ? "text-accent" : "text-muted-foreground")} />
                  </div>
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
                          <Radio className="w-4 h-4 mr-2" /> Set as Active
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-muted-foreground opacity-50 cursor-not-allowed">
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(playlist.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-4 flex items-center gap-2">
                  {playlist.name}
                  {isActive && <Badge variant="default" className="bg-accent text-primary text-[10px] font-bold">LIVE</Badge>}
                </CardTitle>
                <CardDescription>
                  {playlist.id.startsWith('default') ? "System Default" : "Custom Sequence"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>{playlist.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>~{duration}s loop</span>
                  </div>
                </div>

                <div className="flex -space-x-3 overflow-hidden py-2">
                  {playlist.items.slice(0, 5).map((itemId, i) => {
                    const media = INITIAL_MEDIA.find(m => m.id === itemId);
                    return (
                      <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-muted overflow-hidden relative">
                        {media ? (
                          <Image src={media.url} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-bold">?</div>
                        )}
                      </div>
                    );
                  })}
                  {playlist.items.length > 5 && (
                    <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      +{playlist.items.length - 5}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                <Badge variant={isActive ? "default" : "outline"} className={cn(isActive && "bg-accent text-primary")}>
                  {isActive ? "Active Broadcast" : "Idle"}
                </Badge>
                {isActive ? (
                  <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">
                    <Play className="w-3 h-3 fill-current" /> Preview
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleActivate(playlist.id)}>
                    Activate
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Create New Playlist" : "Edit Playlist"}</DialogTitle>
            <DialogDescription>
              Name your playlist and select media items to include in the loop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input 
                id="playlist-name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="e.g. Morning News Loop"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Media Items ({selectedMediaIds.length} selected)</Label>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search media..." 
                    className="pl-8 h-9 text-xs"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/20">
                <div className="grid grid-cols-1 gap-3">
                  {filteredMediaForSelection.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border bg-white transition-all cursor-pointer hover:border-primary/50",
                        selectedMediaIds.includes(item.id) && "border-primary bg-primary/5 shadow-sm"
                      )}
                      onClick={() => toggleMediaSelection(item.id)}
                    >
                      <Checkbox 
                        checked={selectedMediaIds.includes(item.id)}
                        onCheckedChange={() => toggleMediaSelection(item.id)}
                      />
                      <div className="relative h-12 w-20 rounded overflow-hidden flex-shrink-0 bg-muted">
                        <Image src={item.url} alt={item.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type} • {item.category}</p>
                      </div>
                      {selectedMediaIds.includes(item.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))}
                  {filteredMediaForSelection.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">No matching media found in library.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlaylist} className="gap-2">
              {dialogMode === "add" ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {dialogMode === "add" ? "Create Playlist" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
