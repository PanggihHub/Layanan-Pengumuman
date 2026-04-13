"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
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
  Sparkles,
  CloudSun,
  MapPin,
  Globe,
  Info
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
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [tempUnit, setTempUnit] = useState("C");
  
  // Display Controls (Master Defaults)
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>(SCREEN_SETTINGS.displayLayout);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDisplayLayout(d.displayLayout || "single");
        setSyncUrl(d.syncUrl || "https://api.screensense.cloud/v1");
        setHeartbeat(d.heartbeat?.toString() || "60");
        setSessionTimeout(d.sessionTimeout?.toString() || "30");
        setAutoUpdate(d.autoUpdate ?? true);
        setTimezone(d.timezone || "Asia/Jakarta");
        setTempUnit(d.tempUnit || "C");
      }
    });
    return unsub;
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    
    await setDoc(doc(db, "settings", "global"), {
      displayLayout,
      syncUrl,
      heartbeat: parseInt(heartbeat),
      sessionTimeout: parseInt(sessionTimeout),
      autoUpdate,
      timezone,
      tempUnit
    }, { merge: true });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration Saved",
        description: "Global system fundamentals and display layout defaults updated.",
      });
    }, 1000);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">Core platform orchestration and master display parameters.</p>
      </div>

      <div className="grid gap-6">
        {/* Signage Layout Card */}
        <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layout className="w-5 h-5 text-accent" />
              Signage Display Visibility Previews
            </CardTitle>
            <CardDescription>Visualize system-wide display presets. Note: This module acts as a template reference for hardware orchestration.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label>Master Fallback Layout</Label>
                  <Select value={displayLayout} onValueChange={(v: any) => setDisplayLayout(v)}>
                    <SelectTrigger className="rounded-xl">
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



        {/* Cloud Infrastructure Card */}
        <Card className="border-primary/10 shadow-sm rounded-2xl overflow-hidden">
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
                <Input value={syncUrl} onChange={e => setSyncUrl(e.target.value)} className="font-mono text-sm rounded-xl" />
                <Button variant="outline" size="icon" className="rounded-xl"><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Timer className="w-4 h-4 text-accent" /> Device Heartbeat (Sec)</Label>
                <Input type="number" value={heartbeat} onChange={e => setHeartbeat(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cloud className="w-4 h-4 text-accent" /> Session Duration (Min)</Label>
                <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Global Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                    <SelectItem value="Asia/Makassar">Makassar (GMT+8)</SelectItem>
                    <SelectItem value="Asia/Jayapura">Jayapura (GMT+9)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><CloudSun className="w-4 h-4 text-accent" /> Temp Unit</Label>
                <Select value={tempUnit} onValueChange={setTempUnit}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="C">Celsius (°C)</SelectItem>
                    <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Auto-Publish Updates</p>
                <p className="text-xs text-muted-foreground">Automatically push changes to screens without manual sync.</p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => window.location.reload()} className="rounded-xl">Discard Changes</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-12 rounded-xl h-12 shadow-xl shadow-primary/20 bg-primary font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Apply Fundamentals
          </Button>
        </div>
      </div>
    </div>
  );
}
