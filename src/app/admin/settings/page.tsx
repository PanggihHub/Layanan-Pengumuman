"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Shield, 
  RefreshCw, 
  Save, 
  Server,
  Cloud,
  Timer,
  Smartphone,
  CheckCircle2,
  Layout,
  Eye,
  EyeOff,
  ScreenShare,
  Monitor,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SCREEN_SETTINGS, DisplayLayout } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function SystemConfig() {
  const [syncUrl, setSyncUrl] = useState("https://api.screensense.cloud/v1");
  const [heartbeat, setHeartbeat] = useState("60");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // Display Controls (Master Defaults)
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>(SCREEN_SETTINGS.displayLayout);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    // Simulate updating mock DB
    SCREEN_SETTINGS.displayLayout = displayLayout;

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration Saved",
        description: "Global system parameters and display settings updated.",
      });
    }, 1200);
  };

  const LayoutPreview = ({ layout }: { layout: DisplayLayout }) => {
    const boxClass = "bg-primary/20 border-2 border-primary/40 rounded flex items-center justify-center";
    return (
      <div className="w-full h-full bg-white border rounded p-1">
        {layout === 'single' && <div className={cn("w-full h-full", boxClass)}><Monitor className="w-4 h-4" /></div>}
        {layout === 'grid-2x2' && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
            <div className={boxClass} />
            <div className={boxClass} />
            <div className={boxClass} />
            <div className={boxClass} />
          </div>
        )}
        {layout === 'split-v' && (
          <div className="grid grid-cols-2 gap-1 h-full">
            <div className={boxClass} />
            <div className={boxClass} />
          </div>
        )}
        {layout === 'split-h' && (
          <div className="grid grid-rows-2 gap-1 h-full">
            <div className={boxClass} />
            <div className={boxClass} />
          </div>
        )}
        {layout === 'widget-hub' && (
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className={cn(boxClass, "bg-zinc-800")}><Sparkles className="w-3 h-3 text-white" /></div>
            <div className={cn(boxClass, "bg-sky-600")}><Sparkles className="w-3 h-3 text-white" /></div>
            <div className={cn(boxClass, "bg-zinc-950")}><Sparkles className="w-3 h-3 text-white" /></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">Core platform orchestration and master display parameters.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layout className="w-5 h-5 text-accent" />
              Signage Display Visibility Defaults
            </CardTitle>
            <CardDescription>Control the master fallback layout for screens without specific overrides.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label>Master Fallback Layout</Label>
                  <Select value={displayLayout} onValueChange={(v: any) => setDisplayLayout(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single (1x1 Rotation)</SelectItem>
                      <SelectItem value="grid-2x2">Grid (2x2 Multi-Feed)</SelectItem>
                      <SelectItem value="split-v">Split Vertical (Left/Right)</SelectItem>
                      <SelectItem value="split-h">Split Horizontal (Top/Bottom)</SelectItem>
                      <SelectItem value="widget-hub">Widget Hub (Real-time Hub)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic mt-2 bg-primary/5 p-2 rounded">Note: Visibility toggles (Ticker, QR, etc.) are now managed per sequence in the Playlists menu for granular control.</p>
                </div>
              </div>
              
              <div className="w-full md:w-64 space-y-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Layout Preview</Label>
                <div className="aspect-video relative group border shadow-sm rounded-xl overflow-hidden bg-muted/20">
                  <LayoutPreview layout={displayLayout} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                    <ScreenShare className="text-primary w-8 h-8" />
                  </div>
                </div>
                <div className="text-[9px] text-center text-muted-foreground uppercase font-black tracking-tighter">Mock Visual Representative</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Server className="w-5 h-5" />
              Cloud Infrastructure
            </CardTitle>
            <CardDescription>Configure telemetry and session parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Cloud Sync Endpoint</Label>
              <div className="flex gap-2">
                <Input value={syncUrl} onChange={e => setSyncUrl(e.target.value)} className="font-mono text-sm" />
                <Button variant="outline" size="icon"><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Timer className="w-4 h-4 text-accent" /> Device Heartbeat (Sec)</Label>
                <Input type="number" value={heartbeat} onChange={e => setHeartbeat(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cloud className="w-4 h-4 text-accent" /> Session Duration (Min)</Label>
                <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-dashed">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Auto-Publish Updates</p>
                <p className="text-xs text-muted-foreground">Automatically push changes to screens without manual sync.</p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => window.location.reload()}>Discard Changes</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
            Apply Global Config
          </Button>
        </div>
      </div>
    </div>
  );
}
