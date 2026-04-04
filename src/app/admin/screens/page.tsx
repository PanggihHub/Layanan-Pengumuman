"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Monitor, 
  RefreshCw, 
  Settings2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Play,
  Signal,
  MoreVertical
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SCREEN_STATUS, SCREEN_SETTINGS, PLAYLISTS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function ScreensManagement() {
  const [ticker, setTicker] = useState(SCREEN_SETTINGS.tickerMessage);
  const [activePlaylist, setActivePlaylist] = useState(SCREEN_SETTINGS.activePlaylistId);
  const [isEmergency, setIsEmergency] = useState(SCREEN_SETTINGS.emergencyAlert);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    setIsSyncing(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Settings Published",
        description: "Global display settings have been synced to all active screens.",
      });
    }, 1500);
  };

  const handleEmergencyToggle = (val: boolean) => {
    setIsEmergency(val);
    toast({
      variant: val ? "destructive" : "default",
      title: val ? "EMERGENCY BROADCAST ACTIVE" : "Emergency Resolved",
      description: val 
        ? "Override active. All screens are now displaying the emergency alert." 
        : "Displays returned to standard playback.",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Monitor className="w-8 h-8 text-accent" />
            Screen Management
          </h1>
          <p className="text-muted-foreground">Monitor device health and control global broadcast settings.</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={() => handleSaveSettings()}
          disabled={isSyncing}
        >
          <RefreshCw className={isSyncing ? "animate-spin" : ""} />
          Manual Sync All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Global Display Settings
              </CardTitle>
              <CardDescription>These changes affect all screens connected to the network.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Live Ticker Message</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ticker" 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="Enter message for the bottom ticker..."
                    className="flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Recommended: Under 200 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Active Global Playlist</Label>
                  <Select value={activePlaylist} onValueChange={setActivePlaylist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYLISTS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Transition</Label>
                  <Select defaultValue="crossfade">
                    <SelectTrigger>
                      <SelectValue placeholder="Effect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crossfade">Smooth Crossfade</SelectItem>
                      <SelectItem value="slide">Slide Horizontal</SelectItem>
                      <SelectItem value="instant">Instant Cut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/10 justify-end py-4">
              <Button onClick={handleSaveSettings} disabled={isSyncing}>
                {isSyncing ? "Syncing..." : "Update All Screens"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-red-200 bg-red-50/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-red-900">Emergency Override</CardTitle>
                    <CardDescription className="text-red-700/70">Instantly take over all screens with a critical alert.</CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={isEmergency} 
                  onCheckedChange={handleEmergencyToggle}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Device Health Summary */}
        <div className="space-y-6">
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-lg">Network Health</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {SCREEN_STATUS.map((screen) => (
                  <div key={screen.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {screen.status === "Online" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{screen.name}</p>
                        <p className="text-xs text-muted-foreground">{screen.id} • {screen.lastSeen}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={screen.status === "Online" ? "default" : "destructive"} className="text-[10px]">
                        {screen.status}
                      </Badge>
                      <p className="text-[10px] mt-1 text-muted-foreground font-mono">Up: {screen.uptime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 py-3 justify-center">
              <Button variant="link" size="sm" className="text-xs font-bold text-primary">Download Health Report (PDF)</Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Signal className="text-accent w-6 h-6" />
                <h3 className="font-bold">Live Preview</h3>
              </div>
              <div className="aspect-video bg-black rounded-lg relative overflow-hidden flex items-center justify-center text-white/20">
                <Play className="w-12 h-12" />
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-accent/30 rounded-full">
                  <div className="w-1/3 h-full bg-accent rounded-full animate-[progress_5s_linear_infinite]" />
                </div>
              </div>
              <p className="text-[10px] text-center mt-3 text-muted-foreground">Streaming low-res proxy of Main Hall A</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
