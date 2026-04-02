
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const mockMedia = [
  { id: 1, name: "Orientation_Hero.jpg", type: "image", size: "2.4 MB", date: "2023-10-12", url: "https://picsum.photos/seed/screensense1/400/300" },
  { id: 2, name: "Science_Fact_Photosynthesis.mp4", type: "video", size: "45.1 MB", date: "2023-10-14", url: "https://picsum.photos/seed/science/400/300" },
  { id: 3, name: "Campus_Map_Vertical.png", type: "image", size: "1.8 MB", date: "2023-10-15", url: "https://picsum.photos/seed/campus/400/300" },
  { id: 4, name: "Welcome_Slide_V2.jpg", type: "image", size: "3.2 MB", date: "2023-10-16", url: "https://picsum.photos/seed/display/400/300" },
  { id: 5, name: "Graduation_Promo.mov", type: "video", size: "128.4 MB", date: "2023-10-18", url: "https://picsum.photos/seed/grad/400/300" },
  { id: 6, name: "Cafeteria_Menu.pdf", type: "document", size: "0.5 MB", date: "2023-10-20", url: "https://picsum.photos/seed/food/400/300" },
];

export default function MediaLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Media Library</h1>
          <p className="text-muted-foreground">Manage your visual assets and external media streams.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" /> YouTube/External
          </Button>
          <Button className="bg-primary gap-2">
            <Plus className="w-4 h-4" /> Upload Media
          </Button>
        </div>
      </div>

      <Card className="bg-white/50 border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by filename..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
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

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockMedia.map((media) => (
            <Card key={media.id} className="group overflow-hidden hover:ring-2 hover:ring-accent transition-all">
              <div className="relative aspect-video">
                <Image src={media.url} alt={media.name} fill className="object-cover" />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" /> Rename</DropdownMenuItem>
                      <DropdownMenuItem><PlayCircle className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {media.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayCircle className="w-12 h-12 text-white/80" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-sm truncate max-w-[150px]">{media.name}</h3>
                    <p className="text-xs text-muted-foreground">{media.size} • {media.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                    {media.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          <button className="border-2 border-dashed border-muted rounded-xl aspect-video flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors text-muted-foreground">
            <Plus className="w-10 h-10" />
            <span className="font-semibold">Add More Assets</span>
          </button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold text-left">Preview</th>
                  <th className="px-6 py-3 font-semibold text-left">Filename</th>
                  <th className="px-6 py-3 font-semibold text-left">Type</th>
                  <th className="px-6 py-3 font-semibold text-left">Size</th>
                  <th className="px-6 py-3 font-semibold text-left">Added</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockMedia.map((media) => (
                  <tr key={media.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-12 h-8 rounded relative overflow-hidden bg-muted">
                        <Image src={media.url} alt={media.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium">{media.name}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {media.type === "video" ? <PlayCircle className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                        <span className="capitalize">{media.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{media.size}</td>
                    <td className="px-6 py-3 text-muted-foreground">{media.date}</td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
