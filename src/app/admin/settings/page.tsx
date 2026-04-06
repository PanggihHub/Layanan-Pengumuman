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
  EyeOff
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

export default function SystemConfig() {
  const [syncUrl, setSyncUrl] = useState("https://api.screensense.cloud/v1");
  const [heartbeat, setHeartbeat] = useState("60");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // Display Controls
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>(SCREEN_SETTINGS.displayLayout);
  const [showTicker, setShowTicker] = useState(SCREEN_SETTINGS.showTicker);
  const [showInfoCard, setShowInfoCard] = useState(SCREEN_SETTINGS.showInfoCard);
  const [showWorship, setShowWorship] = useState(SCREEN_SETTINGS.showWorship);
  const [showQR, setShowQR] = useState(SCREEN_SETTINGS.showQR);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    // Simulate updating mock DB
    SCREEN_SETTINGS.displayLayout = displayLayout;
    SCREEN_SETTINGS.showTicker = showTicker;
    SCREEN_SETTINGS.showInfoCard = showInfoCard;
    SCREEN_SETTINGS.showWorship = showWorship;
    SCREEN_SETTINGS.showQR = showQR;

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration Saved",
        description: "Global system parameters and display settings updated.",
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">Core platform orchestration and display visibility parameters.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layout className="w-5 h-5 text-accent" />
              Signage Display Visibility
            </CardTitle>
            <CardDescription>Control what components are visible on the public /display client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Active Screen Layout</Label>
                <Select value={displayLayout} onValueChange={(v: any) => setDisplayLayout(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (1x1 Rotation)</SelectItem>
                    <SelectItem value="grid-2x2">Grid (2x2 Multi-Feed)</SelectItem>
                    <SelectItem value="split-v">Split Vertical (Left/Right)</SelectItem>
                    <SelectItem value="split-h">Split Horizontal (Top/Bottom)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">Grid modes display multiple items from the playlist simultaneously.</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Bottom Ticker</p>
                  <p className="text-[10px] text-muted-foreground">News headline scrolling bar.</p>
                </div>
                <Switch checked={showTicker} onCheckedChange={setShowTicker} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Content Info Overlays</p>
                  <p className="text-[10px] text-muted-foreground">Floating title and category cards.</p>
                </div>
                <Switch checked={showInfoCard} onCheckedChange={setShowInfoCard} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Worship Widget</p>
                  <p className="text-[10px] text-muted-foreground">Upcoming religious service schedule.</p>
                </div>
                <Switch checked={showWorship} onCheckedChange={setShowWorship} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Interactive Hub (QR)</p>
                  <p className="text-[10px] text-muted-foreground">Scan for campus information details.</p>
                </div>
                <Switch checked={showQR} onCheckedChange={setShowQR} />
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
