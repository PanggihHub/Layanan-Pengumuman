"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid2X2, 
  List, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  PlayCircle,
  FileImage,
  X,
  Upload,
  Link as LinkIcon,
  Globe,
  HardDrive,
  Info,
  Scissors,
  Clock,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { INITIAL_MEDIA, MediaItem, MediaType } from "@/lib/mock-data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function MediaLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_MEDIA);
  const { toast } = useToast();

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<MediaItem | null>(null);

  // Form states
  const [sourceOrigin, setSourceOrigin] = useState<"internal" | "external">("internal");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<MediaType>("image");
  const [newUrl, setNewUrl] = useState("");
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(30);

  const filteredMedia = useMemo(() => {
    return mediaItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [mediaItems, searchQuery, filterType]);

  const handleDelete = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item Deleted",
      description: "Media asset has been removed from the library.",
    });
  };

  const handleSaveMedia = () => {
    if (!newName || (sourceOrigin === 'external' && !newUrl)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (dialogMode === "add") {
      const newItem: MediaItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newName,
        description: newDescription,
        type: newType,
        source: sourceOrigin,
        size: sourceOrigin === 'internal' ? "2.4 MB" : "URL",
        date: new Date().toISOString().split('T')[0],
        url: sourceOrigin === 'internal' ? 'https://picsum.photos/seed/new/1920/1080' : newUrl,
        category: 'events',
        startTime: newType === 'video' ? startTime : undefined,
        endTime: newType === 'video' ? endTime : undefined,
      };
      setMediaItems(prev => [newItem, ...prev]);
      toast({ title: "Media Added", description: `${newName} has been added.` });
    } else if (currentItem) {
      setMediaItems(prev => prev.map(item => 
        item.id === currentItem.id ? { 
          ...item, 
          name: newName, 
          description: newDescription, 
          url: newUrl || item.url, 
          type: newType,
          source: sourceOrigin,
          startTime: newType === 'video' ? startTime : undefined,
          endTime: newType === 'video' ? endTime : undefined,
        } : item
      ));
      toast({ title: "Media Updated", description: "Changes saved successfully." });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewUrl("");
    setNewType("image");
    setSourceOrigin("internal");
    setStartTime(0);
    setEndTime(30);
    setCurrentItem(null);
  };

  const openAddDialog = () => {
    setDialogMode("add");
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MediaItem) => {
    setDialogMode("edit");
    setCurrentItem(item);
    setNewName(item.name);
    setNewDescription(item.description || "");
    setNewUrl(item.url);
    setNewType(item.type);
    setSourceOrigin(item.source);
    setStartTime(item.startTime || 0);
    setEndTime(item.endTime || 30);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Media Library</h1>
          <p className="text-muted-foreground">Manage your visual assets and external media streams.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> Add New Source
        </Button>
      </div>

      <Card className="bg-white/50 border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by filename or description..." 
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
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {filterType ? `Filter: ${filterType}` : "All Types"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType(null)}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("image")}>Images</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("video")}>Videos</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="border rounded-lg flex p-1 bg-white">
                <Button 
                  variant={view === "grid" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setView("grid")}
                  className="h-8 w-8"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={view === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setView("list")}
                  className="h-8 w-8"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/50 rounded-xl border-2 border-dashed">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No results found for your search.</p>
          <Button variant="link" onClick={() => {setSearchQuery(""); setFilterType(null);}}>Clear all filters</Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="group overflow-hidden hover:ring-2 hover:ring-accent transition-all flex flex-col">
              <div className="relative aspect-video bg-muted shrink-0">
                <Image 
                  src={media.url} 
                  alt={media.name} 
                  fill 
                  className="object-cover"
                  unoptimized 
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(media)}>
                        <Edit3 className="w-4 h-4 mr-2" /> Edit Source
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(media.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {media.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <PlayCircle className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  {media.source === 'external' ? (
                    <Badge className="bg-blue-600/80 backdrop-blur-sm gap-1 border-none">
                      <Globe className="w-3 h-3" /> External
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600/80 backdrop-blur-sm gap-1 border-none">
                      <HardDrive className="w-3 h-3" /> Internal
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{media.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{media.size} • {media.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 shrink-0">
                    {media.type}
                  </Badge>
                </div>
                {media.type === 'video' && media.startTime !== undefined && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-tighter mt-1 bg-accent/10 px-2 py-0.5 rounded w-fit">
                    <Scissors className="w-3 h-3" /> Selected Clip: {media.startTime}s - {media.endTime}s
                  </div>
                )}
                {media.description && (
                  <div className="flex gap-1.5 items-start mt-1">
                    <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {media.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold text-left">Preview</th>
                  <th className="px-6 py-3 font-semibold text-left">Filename & Description</th>
                  <th className="px-6 py-3 font-semibold text-left">Source</th>
                  <th className="px-6 py-3 font-semibold text-left">Size</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((media) => (
                  <tr key={media.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-12 h-8 rounded relative overflow-hidden bg-muted">
                        <Image src={media.url} alt={media.name} fill className="object-cover" unoptimized />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{media.name}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 italic">{media.description || "No description provided"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {media.source === 'external' ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Globe className="w-4 h-4" /> <span>External</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <HardDrive className="w-4 h-4" /> <span>Internal</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{media.size}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(media)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(media.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Unified Add/Edit Dialog with OBS-style Preview */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Media Source" : "Edit Media Source"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" 
                ? "Define your media parameters and clipping region." 
                : "Modify the properties and source transform for this asset."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Form Side */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Source Origin</Label>
                <Tabs value={sourceOrigin} onValueChange={(v: any) => setSourceOrigin(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger value="internal" className="text-xs">Internal</TabsTrigger>
                    <TabsTrigger value="external" className="text-xs">External</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Title</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Campus_Announcement"
                    className="h-9"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider">Format</Label>
                  <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Still Image</SelectItem>
                      <SelectItem value="video">Motion Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newType === 'video' && (
                  <div className="space-y-4 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase">
                      <Scissors className="w-4 h-4" />
                      Timeline Clipping
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="startTime" className="text-[10px] uppercase">Start (s)</Label>
                        <Input 
                          id="startTime" 
                          type="number" 
                          value={startTime} 
                          onChange={(e) => setStartTime(Number(e.target.value))} 
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="endTime" className="text-[10px] uppercase">End (s)</Label>
                        <Input 
                          id="endTime" 
                          type="number" 
                          value={endTime} 
                          onChange={(e) => setEndTime(Number(e.target.value))} 
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {sourceOrigin === "external" && (
                  <div className="grid gap-2 pt-2">
                    <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider">Direct URL</Label>
                    <Input 
                      id="url" 
                      value={newUrl} 
                      onChange={(e) => setNewUrl(e.target.value)} 
                      placeholder="https://example.com/stream.mp4"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* OBS Style Preview Side */}
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Source Transform Preview
                <Badge variant="outline" className="text-[8px] bg-white border-red-500 text-red-600 font-black animate-pulse">ACTIVE TRANSFORM</Badge>
              </Label>
              <div className="relative aspect-video bg-zinc-950 rounded-lg overflow-hidden border-2 border-zinc-800 shadow-2xl">
                {/* Red OBS Selection Box */}
                <div className="absolute inset-2 border-2 border-red-500 z-20 pointer-events-none ring-[100vw] ring-black/40">
                  {/* Anchor handles like OBS */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-red-500" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500" />
                  <div className="absolute top-1/2 -left-1 w-2 h-2 bg-red-500 -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-1 w-2 h-2 bg-red-500 -translate-y-1/2" />
                </div>

                <div className="w-full h-full relative group">
                  <Image 
                    src={newUrl || (currentItem?.url || 'https://picsum.photos/seed/preview/1920/1080')} 
                    alt="Transform View" 
                    fill 
                    className="object-cover opacity-80"
                    unoptimized
                  />
                  {newType === 'video' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <PlayCircle className="w-12 h-12 text-white/40" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-white/60">Clip Preview</p>
                    </div>
                  )}
                </div>

                {/* Status Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30 pointer-events-none">
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] font-black uppercase tracking-tighter text-red-500 bg-black/60 px-2 py-0.5 rounded w-fit">Transforming Source...</p>
                    <p className="text-xs font-bold text-white drop-shadow-md truncate max-w-[150px]">{newName || "Untitled Source"}</p>
                  </div>
                  <div className="bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    {newType === 'video' ? `T: ${startTime}s > ${endTime}s` : 'MODE: STATIC'}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded border border-dashed text-[10px] text-muted-foreground leading-relaxed italic">
                Adjusting clipping parameters will "transform" the source on the signage timeline. Use the handles (simulated) to define the visual crop of the display.
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMedia} className="gap-2 bg-primary">
              {dialogMode === "add" ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {dialogMode === "add" ? "Create Source" : "Push Transformations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
