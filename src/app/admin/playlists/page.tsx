"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoreVertical, 
  Play, 
  Clock, 
  Layers,
  Trash2,
  Edit2,
  Copy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PLAYLISTS, INITIAL_MEDIA } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState(PLAYLISTS);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Playlist Deleted",
      description: "The playlist has been removed from the system.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Playlists</h1>
          <p className="text-muted-foreground">Organize your media into timed sequences for broadcast.</p>
        </div>
        <Button className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> Create Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => {
          // Count durations - simplified mock logic
          const duration = playlist.items.length * 8; // 8 seconds per item
          
          return (
            <Card key={playlist.id} className="group hover:ring-2 hover:ring-accent transition-all overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Layers className="w-6 h-6 text-accent" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit sequence</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(playlist.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-4">{playlist.name}</CardTitle>
                <CardDescription>Main Campus Display Loop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  {playlist.items.slice(0, 4).map((itemId, i) => {
                    const media = INITIAL_MEDIA.find(m => m.id === itemId);
                    return (
                      <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-muted overflow-hidden">
                        {media ? (
                          <img src={media.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-bold">?</div>
                        )}
                      </div>
                    );
                  })}
                  {playlist.items.length > 4 && (
                    <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      +{playlist.items.length - 4}
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                <Badge variant="outline" className="bg-white">Active</Badge>
                <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">
                  <Play className="w-3 h-3 fill-current" /> Preview
                </Button>
              </div>
            </Card>
          );
        })}

        <button className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-colors text-muted-foreground group">
          <div className="bg-muted p-4 rounded-full group-hover:bg-primary/10 transition-colors">
            <Plus className="w-8 h-8 group-hover:text-primary" />
          </div>
          <span className="font-bold">New Playlist</span>
        </button>
      </div>
    </div>
  );
}
