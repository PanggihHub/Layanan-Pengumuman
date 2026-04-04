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
  HardDrive
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [newType, setNewType] = useState<MediaType>("image");
  const [newUrl, setNewUrl] = useState("");

  const filteredMedia = useMemo(() => {
    return mediaItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
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
        type: newType,
        size: sourceOrigin === 'internal' ? "2.4 MB" : "URL",
        date: new Date().toISOString().split('T')[0],
        url: sourceOrigin === 'internal' ? 'https://picsum.photos/seed/new/1920/1080' : newUrl,
        category: 'events'
      };
      setMediaItems(prev => [newItem, ...prev]);
      toast({ title: "Media Added", description: `${newName} has been added.` });
    } else if (currentItem) {
      setMediaItems(prev => prev.map(item => 
        item.id === currentItem.id ? { ...item, name: newName, url: newUrl || item.url, type: newType } : item
      ));
      toast({ title: "Media Updated", description: "Changes saved successfully." });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewUrl("");
    setNewType("image");
    setSourceOrigin("internal");
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
    setNewUrl(item.url);
    setNewType(item.type);
    setSourceOrigin(item.url.startsWith('http') ? "external" : "internal");
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
                placeholder="Search by filename..." 
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
            <Card key={media.id} className="group overflow-hidden hover:ring-2 hover:ring-accent transition-all">
              <div className="relative aspect-video bg-muted">
                <Image 
                  src={media.url} 
                  alt={media.name} 
                  fill 
                  className="object-cover"
                  unoptimized 
                />
                <div className="absolute top-2 right-2">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayCircle className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  {media.url.startsWith('http') ? (
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
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{media.name}</h3>
                    <p className="text-xs text-muted-foreground">{media.size} • {media.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 shrink-0">
                    {media.type}
                  </Badge>
                </div>
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
                  <th className="px-6 py-3 font-semibold text-left">Filename</th>
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
                    <td className="px-6 py-3 font-medium">{media.name}</td>
                    <td className="px-6 py-3">
                      {media.url.startsWith('http') ? (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => openEditDialog(media)}>Edit</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleDelete(media.id)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Media Source" : "Edit Media Source"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" 
                ? "Choose where your content is hosted and provide details." 
                : "Modify the properties of this media asset."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Source Type</Label>
              <Tabs value={sourceOrigin} onValueChange={(v: any) => setSourceOrigin(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="internal" className="gap-2">
                    <Upload className="w-4 h-4" /> Internal
                  </TabsTrigger>
                  <TabsTrigger value="external" className="gap-2">
                    <LinkIcon className="w-4 h-4" /> External
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Filename / Display Title</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Campus_Announcement"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Media Format</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Still Image</SelectItem>
                    <SelectItem value="video">Motion Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sourceOrigin === "external" && (
                <div className="grid gap-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="url">Source URL</Label>
                  <Input 
                    id="url" 
                    value={newUrl} 
                    onChange={(e) => setNewUrl(e.target.value)} 
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-[10px] text-muted-foreground">Ensure the URL is a direct path to the media file or stream.</p>
                </div>
              )}

              {sourceOrigin === "internal" && dialogMode === "add" && (
                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground animate-in slide-in-from-top-2 duration-300">
                  <Upload className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium">Click to select or drag and drop</p>
                  <p className="text-xs">Supports JPG, PNG, MP4 up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMedia} className="gap-2">
              {dialogMode === "add" ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {dialogMode === "add" ? "Create Source" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
