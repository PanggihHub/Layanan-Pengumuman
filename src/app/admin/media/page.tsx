"use client";

import { useState, useMemo, useEffect } from "react";
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
  X,
  Upload,
  Globe,
  HardDrive,
  Info,
  Scissors,
  CheckCircle2,
  FileImage,
  FileVideo
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

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export default function MediaLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
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
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "media"), (snapshot) => {
      const items: MediaItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as MediaItem);
      });
      // Sort items randomly or by date if preferred
      setMediaItems(items);
    });

    return () => unsubscribe();
  }, []);

  const filteredMedia = useMemo(() => {
    return mediaItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [mediaItems, searchQuery, filterType]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "media", id));
      toast({
        title: "Asset Removed",
        description: "Media has been deleted from the cloud library.",
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleSaveMedia = async () => {
    if (!newName) {
      toast({ title: "Title Required", description: "Please enter a name for the asset.", variant: "destructive" });
      return;
    }

    if (sourceOrigin === 'external' && !newUrl) {
      toast({ title: "URL Required", description: "Please provide a source URL for external media.", variant: "destructive" });
      return;
    }

    // Determine final URL
    let finalUrl = newUrl;
    if (sourceOrigin === 'internal' && !newUrl) {
      // Simulate an internal path assignment
      const seed = Math.floor(Math.random() * 1000);
      finalUrl = newType === 'video' 
        ? `https://picsum.photos/seed/${seed}/1920/1080` 
        : `https://picsum.photos/seed/${seed}/1920/1080`;
    }

    if (dialogMode === "add") {
      const newId = Math.random().toString(36).substr(2, 9);
      const newItem: MediaItem = {
        id: newId,
        name: newName,
        description: newDescription,
        type: newType,
        source: sourceOrigin,
        size: sourceOrigin === 'internal' ? `${(Math.random() * 5 + 1).toFixed(1)} MB` : "Stream",
        date: new Date().toISOString().split('T')[0],
        url: finalUrl,
        category: 'campus',
        startTime: newType === 'video' ? startTime : undefined,
        endTime: newType === 'video' ? endTime : undefined,
      };
      await setDoc(doc(db, "media", newId), newItem);
      toast({ title: "Media Created", description: `${newName} has been added to the library.` });
    } else if (currentItem) {
      const updatedItem = { 
        ...currentItem, 
        name: newName, 
        description: newDescription, 
        url: finalUrl, 
        type: newType,
        source: sourceOrigin,
        startTime: newType === 'video' ? startTime : undefined,
        endTime: newType === 'video' ? endTime : undefined,
      };
      await setDoc(doc(db, "media", currentItem.id), updatedItem);
      toast({ title: "Media Updated", description: "All changes synchronized successfully." });
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
    setIsUploading(false);
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

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({ title: "Upload Complete", description: "File successfully staged for processing." });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Media Library</h1>
          <p className="text-muted-foreground">Manage your visual assets and external media streams.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Media Source
        </Button>
      </div>

      <Card className="bg-white/50 border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 w-full md:w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search assets by title..." 
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
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-10 rounded-xl px-4">
                    <Filter className="w-4 h-4" />
                    {filterType ? `Type: ${filterType}` : "All Formats"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl p-2">
                  <DropdownMenuItem onClick={() => setFilterType(null)} className="rounded-lg">All Formats</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("image")} className="rounded-lg">Still Images</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("video")} className="rounded-lg">Motion Videos</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="border rounded-xl flex p-1 bg-white shadow-sm">
                <Button 
                  variant={view === "grid" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setView("grid")}
                  className="h-8 w-8 rounded-lg"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={view === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => setView("list")}
                  className="h-8 w-8 rounded-lg"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white/50 rounded-3xl border-2 border-dashed border-primary/10">
          <Search className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xl font-black text-primary/30 uppercase tracking-widest">No matching assets</p>
          <Button variant="link" onClick={() => {setSearchQuery(""); setFilterType(null);}} className="text-accent mt-2">Clear all filters</Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="group overflow-hidden hover:ring-2 hover:ring-accent transition-all flex flex-col rounded-2xl border-primary/5 shadow-sm">
              <div className="relative aspect-video bg-muted shrink-0">
                {media.source === "external" && extractYouTubeId(media.url) ? (
                   <Image src={`https://img.youtube.com/vi/${extractYouTubeId(media.url)}/hqdefault.jpg`} alt={media.name} fill className="object-cover" unoptimized/>
                ) : (
                  <Image 
                    src={media.url || 'https://picsum.photos/seed/placeholder/1920/1080'} 
                    alt={media.name} 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2">
                      <DropdownMenuItem onClick={() => openEditDialog(media)} className="rounded-lg">
                        <Edit3 className="w-4 h-4 mr-2" /> Modify Source
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(media.id)} className="text-red-600 rounded-lg">
                        <Trash2 className="w-4 h-4 mr-2" /> Remove Asset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {media.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <PlayCircle className="w-10 h-10 text-white/80" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  {media.source === 'external' ? (
                    <Badge className="bg-blue-600/80 backdrop-blur-sm gap-1 border-none rounded-md px-2 py-0.5 text-[10px]">
                      <Globe className="w-3 h-3" /> External
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600/80 backdrop-blur-sm gap-1 border-none rounded-md px-2 py-0.5 text-[10px]">
                      <HardDrive className="w-3 h-3" /> Internal
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm truncate text-primary/80 uppercase tracking-tight">{media.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{media.size} • {media.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[9px] font-black tracking-[0.1em] px-1.5 py-0 shrink-0 bg-white">
                    {media.type}
                  </Badge>
                </div>
                {media.type === 'video' && media.startTime !== undefined && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-accent uppercase tracking-[0.1em] mt-1 bg-accent/10 px-2 py-1 rounded-lg w-fit">
                    <Scissors className="w-3 h-3" /> {media.startTime}s - {media.endTime}s
                  </div>
                )}
                {media.description && (
                  <div className="flex gap-1.5 items-start mt-1">
                    <Info className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight italic">
                      {media.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl overflow-hidden border-primary/5 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Preview</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Filename</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Origin</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Storage</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Ops</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((media) => (
                  <tr key={media.id} className="border-b hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-14 h-9 rounded-lg relative overflow-hidden bg-muted border">
                        <Image src={media.url || 'https://picsum.photos/seed/placeholder/1920/1080'} alt={media.name} fill className="object-cover" unoptimized />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-primary/70 uppercase tracking-tight text-xs">{media.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px] mt-0.5">{media.description || "No metadata description"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {media.source === 'external' ? (
                        <Badge variant="secondary" className="text-blue-600 bg-blue-50 border-blue-100 gap-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <Globe className="w-3 h-3" /> External
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 border-emerald-100 gap-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <HardDrive className="w-3 h-3" /> Internal
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{media.size}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(media)} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                          <Edit3 className="w-4 h-4 text-primary/70" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(media.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600">
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

      {/* Unified Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">{dialogMode === "add" ? "Stage New Asset" : "Modify Media Profile"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" 
                ? "Define your source parameters and visual transformations." 
                : "Update the configuration and timeline properties for this asset."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 py-4">
            {/* Form Side */}
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Source Identity</Label>
                <Tabs value={sourceOrigin} onValueChange={(v: any) => setSourceOrigin(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-muted/50 p-1">
                    <TabsTrigger value="internal" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Cloud Storage</TabsTrigger>
                    <TabsTrigger value="external" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">External Feed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Asset Title</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Orientation_Morning_Loop"
                    className="h-11 rounded-xl border-muted-foreground/20"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Media Class</Label>
                  <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                    <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20">
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="image">Static Image</SelectItem>
                      <SelectItem value="video">Motion Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newType === 'video' && (
                  <div className="space-y-4 pt-4 border-t border-dashed border-primary/20">
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
                      <Scissors className="w-4 h-4" />
                      Timeline Transform
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="startTime" className="text-[9px] font-bold uppercase tracking-widest opacity-60">Entry (Sec)</Label>
                        <Input 
                          id="startTime" 
                          type="number" 
                          value={startTime} 
                          onChange={(e) => setStartTime(Number(e.target.value))} 
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="endTime" className="text-[9px] font-bold uppercase tracking-widest opacity-60">Exit (Sec)</Label>
                        <Input 
                          id="endTime" 
                          type="number" 
                          value={endTime} 
                          onChange={(e) => setEndTime(Number(e.target.value))} 
                          className="h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {sourceOrigin === "external" ? (
                  <div className="grid gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="url" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Source Provider URL</Label>
                    <Input 
                      id="url" 
                      value={newUrl} 
                      onChange={(e) => setNewUrl(e.target.value)} 
                      placeholder="https://www.youtube.com/watch?v=XXXXX"
                      className="h-11 rounded-xl border-muted-foreground/20 font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Local Staging</Label>
                    <div 
                      className="w-full h-32 border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                      onClick={handleSimulatedUpload}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select file from filesystem</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Asset Metadata</Label>
                  <Textarea 
                    id="desc" 
                    value={newDescription} 
                    onChange={(e) => setNewDescription(e.target.value)} 
                    placeholder="Brief description for internal organization..."
                    className="h-20 rounded-xl border-muted-foreground/20 resize-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Telemetry Preview */}
            <div className="lg:col-span-2 space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-between">
                Signal Proxy View
                <Badge variant="outline" className="text-[8px] bg-white border-emerald-500 text-emerald-600 font-black animate-pulse">LIVE FEED</Badge>
              </Label>
              <div className="relative aspect-square lg:aspect-video bg-zinc-950 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
                <div className="w-full h-full relative group">
                  {extractYouTubeId(newUrl || (currentItem?.url || '')) ? (
                    <Image 
                      src={`https://img.youtube.com/vi/${extractYouTubeId(newUrl || (currentItem?.url || ''))}/hqdefault.jpg`} 
                      alt="Source View" 
                      fill 
                      className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                      unoptimized
                    />
                  ) : (
                    <Image 
                      src={newUrl || (currentItem?.url || 'https://picsum.photos/seed/preview/1920/1080')} 
                      alt="Source View" 
                      fill 
                      className="object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
                      unoptimized
                    />
                  )}
                  {newType === 'video' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <PlayCircle className="w-12 h-12 text-white/40" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-white/60">Timeline Active</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <FileImage className="w-12 h-12 text-white/40" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-white/60">Static Signal</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30 pointer-events-none">
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] font-black uppercase tracking-tighter text-emerald-500 bg-black/60 px-2 py-0.5 rounded w-fit">Processing Transform...</p>
                    <p className="text-xs font-black text-white drop-shadow-md truncate max-w-[120px] uppercase tracking-tight">{newName || "PENDING_ID"}</p>
                  </div>
                  <div className="bg-black/80 px-2 py-1 rounded-lg text-[10px] font-mono text-primary border border-primary/30">
                    {newType === 'video' ? `T: ${startTime}s > ${endTime}s` : 'MODE: STILL'}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20 text-[10px] text-muted-foreground leading-relaxed italic">
                <div className="flex gap-2 items-start">
                   <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                   <p>Adjusting the timeline transforms (entry/exit seconds) will automatically "clip" the source during signage playback. Internal assets are securely hashed and stored in your cloud bucket.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6">Discard</Button>
            <Button onClick={handleSaveMedia} className="gap-2 h-12 px-10 rounded-xl bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-tighter">
              {dialogMode === "add" ? <CheckCircle2 className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              {dialogMode === "add" ? "Stage Asset" : "Push Updates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
