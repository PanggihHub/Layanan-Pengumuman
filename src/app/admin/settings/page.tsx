"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  RefreshCw,
  Save,
  Server,
  Cloud,
  Timer,
  CheckCircle2,
  Layout,
  ScreenShare,
  Monitor,
  Sparkles,
  Zap,
  Film,
  Cpu,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Wifi,
  Info,
  Presentation,
  Copy,
  Eye,
  EyeOff,
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
  SelectValue,
} from "@/components/ui/select";
import { SCREEN_SETTINGS, DisplayLayout } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useQuality } from "@/context/QualityContext";
import {
  GlobalQualityPolicy,
  QUALITY_LADDER,
  QualityTier,
  DEFAULT_QUALITY_POLICY,
} from "@/lib/media-pipeline";

// ─────────────────────────────────────────────────────────────────────────────

export default function SystemConfig() {
  const [syncUrl, setSyncUrl]           = useState("https://api.screensense.cloud/v1");
  const [heartbeat, setHeartbeat]       = useState("60");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [autoUpdate, setAutoUpdate]     = useState(true);
  const [demoCode, setDemoCode]         = useState("SCREENSENSE-DEMO");
  const [showDemoCode, setShowDemoCode] = useState(false);
  const [demoCopied, setDemoCopied]     = useState(false);

  // Display Controls (Master Defaults) — layout preview only, no timezone/temp here
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>(SCREEN_SETTINGS.displayLayout);

  // Global Quality Policy — from QualityContext (synced via Firestore)
  const { policy, updatePolicy } = useQuality();
  const [localPolicy, setLocalPolicy] = useState<GlobalQualityPolicy>(DEFAULT_QUALITY_POLICY);

  // Keep local policy in sync with context
  useEffect(() => { setLocalPolicy(policy); }, [policy]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDisplayLayout(d.displayLayout || "single");
        setSyncUrl(d.syncUrl || "https://api.screensense.cloud/v1");
        setHeartbeat(d.heartbeat?.toString() || "60");
        setSessionTimeout(d.sessionTimeout?.toString() || "30");
        setAutoUpdate(d.autoUpdate ?? true);
        setDemoCode(d.demoCode || "SCREENSENSE-DEMO");
        // NOTE: timezone & tempUnit are now managed exclusively in Localization
      }
    });
    return unsub;
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    await Promise.all([
      setDoc(doc(db, "settings", "global"), {
        displayLayout,
        syncUrl,
        heartbeat: parseInt(heartbeat) || 60,
        sessionTimeout: parseInt(sessionTimeout) || 30,
        autoUpdate,
        demoCode: demoCode.trim().toUpperCase() || "SCREENSENSE-DEMO",
        // timezone & tempUnit intentionally omitted — owned by Localization
      }, { merge: true }),
      updatePolicy(localPolicy),
    ]);

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "System Configuration Saved",
        description: "Infrastructure parameters + Quality Policy pushed to all endpoints.",
      });
    }, 600);
  };

  // ── Layout Preview ─────────────────────────────────────────────────────────
  const LayoutPreview = ({ layout }: { layout: DisplayLayout }) => {
    const boxClass = "bg-primary/20 border-2 border-primary/40 rounded flex items-center justify-center";
    return (
      <div className="w-full h-full bg-white border rounded p-1 dark:bg-zinc-900">
        {layout === "single"     && <div className={cn("w-full h-full", boxClass)}><Monitor className="w-4 h-4" /></div>}
        {layout === "grid-2x2"   && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
            <div className={boxClass} /><div className={boxClass} />
            <div className={boxClass} /><div className={boxClass} />
          </div>
        )}
        {layout === "split-v"    && (
          <div className="grid grid-cols-2 gap-1 h-full">
            <div className={boxClass} /><div className={boxClass} />
          </div>
        )}
        {layout === "split-h"    && (
          <div className="grid grid-rows-2 gap-1 h-full">
            <div className={boxClass} /><div className={boxClass} />
          </div>
        )}
        {layout === "widget-hub" && (
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className={cn(boxClass, "bg-zinc-800")}><Sparkles className="w-3 h-3 text-white" /></div>
            <div className={cn(boxClass, "bg-sky-600")}> <Sparkles className="w-3 h-3 text-white" /></div>
            <div className={cn(boxClass, "bg-zinc-950")}><Sparkles className="w-3 h-3 text-white" /></div>
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Core infrastructure, display layout templates, and adaptive media pipeline policy.
          Regional settings (timezone, temperature, language) are managed in{" "}
          <a href="/admin/languages" className="text-primary font-bold underline-offset-2 hover:underline">
            Localization
          </a>.
        </p>
      </div>

      <div className="grid gap-6">

        {/* ── Display Layout Template Previews ───────────────────────────── */}
        <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layout className="w-5 h-5 text-accent" />
              Display Layout Templates
            </CardTitle>
            <CardDescription>
              Visual reference for hardware layout presets. Select the fallback layout used when no
              playlist defines one. This is a <strong>template preview</strong> — actual per-screen
              layouts are managed in the Playlists and Screens menus.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Master Fallback Layout</Label>
                  <Select value={displayLayout} onValueChange={(v: any) => setDisplayLayout(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single (1×1 Rotation)</SelectItem>
                      <SelectItem value="grid-2x2">Grid (2×2 Multi-Feed)</SelectItem>
                      <SelectItem value="split-v">Split Vertical (Left / Right)</SelectItem>
                      <SelectItem value="split-h">Split Horizontal (Top / Bottom)</SelectItem>
                      <SelectItem value="widget-hub">Widget Hub (Real-time Hub)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    Ticker, QR Code, and weather widget visibility are configured per sequence inside
                    the <strong>Playlists</strong> menu for granular, per-screen control.
                  </span>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                  Layout Preview
                </Label>
                <div className="aspect-video relative group border shadow-sm rounded-xl overflow-hidden bg-muted/20">
                  <LayoutPreview layout={displayLayout} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                    <ScreenShare className="text-primary w-8 h-8" />
                  </div>
                </div>
                <div className="text-[9px] text-center text-muted-foreground uppercase font-black tracking-tighter">
                  Mock Visual · Template Reference
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Global Quality Policy ───────────────────────────────────────── */}
        <Card className="border-primary/10 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5 text-violet-600" />
              Global Quality Policy
              <Badge className="ml-2 text-[8px] font-black uppercase tracking-widest bg-violet-100 text-violet-700 border-violet-200 px-2 py-0.5 animate-pulse">
                LIVE · ALL ENDPOINTS
              </Badge>
            </CardTitle>
            <CardDescription>
              Centralized adaptive video pipeline control. Changes broadcast in real-time to
              Media Library, Playlists, Screens, and all Display Clients via Firestore.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">

            {/* Mode selector */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Fleet Quality Mode
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { mode: "auto",        label: "Auto ABR",  icon: Cpu,          desc: "Device + network decide",  color: "sky" },
                  { mode: "locked",      label: "Locked",    icon: ShieldCheck,  desc: "Force exact quality tier", color: "violet" },
                  { mode: "capped",      label: "Capped",    icon: TrendingDown, desc: "ABR with max ceiling",     color: "amber" },
                  { mode: "performance", label: "Stability", icon: Wifi,         desc: "Prefer lowest stall risk", color: "emerald" },
                ] as const).map(({ mode, label, icon: Icon, desc, color }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocalPolicy(p => ({ ...p, mode }))}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      localPolicy.mode === mode
                        ? `bg-${color}-50 border-${color}-300 ring-2 ring-${color}-200`
                        : "bg-white border-muted hover:border-primary/30 dark:bg-zinc-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 mb-2",
                      localPolicy.mode === mode ? `text-${color}-600` : "text-muted-foreground"
                    )} />
                    <p className="text-xs font-black text-primary">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quality tier selects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "lockedQuality"   as const, label: "🔒 Locked Quality", desc: "Every endpoint plays exactly this", disabled: localPolicy.mode !== "locked" },
                { key: "maxQuality"      as const, label: "⬆️ Max Quality Cap", desc: "ABR ceiling for all devices",       disabled: localPolicy.mode === "locked" || localPolicy.mode === "performance" },
                { key: "fallbackQuality" as const, label: "⬇️ Fallback Floor",  desc: "Minimum quality allowed",           disabled: false },
              ].map(({ key, label, desc, disabled }) => (
                <div key={key} className={cn("space-y-2", disabled && "opacity-40 pointer-events-none")}>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {label}
                  </Label>
                  <Select
                    value={localPolicy[key]}
                    onValueChange={(v) => setLocalPolicy(p => ({ ...p, [key]: v as QualityTier }))}
                    disabled={disabled}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl p-2">
                      {QUALITY_LADDER.map(q => (
                        <SelectItem key={q} value={q} className="rounded-lg">
                          <span className="flex items-center gap-2">
                            {q === "480p" || q === "720p" || q === "1080p"
                              ? <Film className="w-3 h-3 text-emerald-600" />
                              : <Zap  className="w-3 h-3 text-violet-600" />}
                            {q}{q === "1080p" ? " (FHD)" : q === "4K" ? " (UHD)" : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* ABR toggles + sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                <div>
                  <p className="text-sm font-black">Adaptive Bitrate (ABR)</p>
                  <p className="text-xs text-muted-foreground">Auto upgrade/downgrade during playback</p>
                </div>
                <Switch
                  checked={localPolicy.abrEnabled}
                  onCheckedChange={(v) => setLocalPolicy(p => ({ ...p, abrEnabled: v }))}
                  disabled={localPolicy.mode === "locked" || localPolicy.mode === "performance"}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                <div>
                  <p className="text-sm font-black">Disable Lazy Loading</p>
                  <p className="text-xs text-muted-foreground">Preload all assets immediately fleet-wide</p>
                </div>
                <Switch
                  checked={localPolicy.disableLazyLoad}
                  onCheckedChange={(v) => setLocalPolicy(p => ({ ...p, disableLazyLoad: v }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { field: "stallThreshold"     as const, label: "Stall Threshold (events)", min: 1,   max: 5,    step: 1,   unit: "",   desc: "Stalls before quality downgrades" },
                { field: "upgradeBufferSeconds" as const, label: "Upgrade Buffer (s)",       min: 5,   max: 30,   step: 1,   unit: "s",  desc: "Smooth seconds before upgrading" },
                { field: "transitionMs"       as const, label: "Crossfade (ms)",            min: 200, max: 1500, step: 100, unit: "ms", desc: "Quality-change transition duration" },
              ].map(({ field, label, min, max, step, unit, desc }) => (
                <div key={field} className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {label}
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={min} max={max} step={step}
                      value={localPolicy[field] as number}
                      onChange={e => setLocalPolicy(p => ({ ...p, [field]: Number(e.target.value) }))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-black text-primary w-12 text-right">
                      {localPolicy[field] as number}{unit}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            {/* Live policy summary */}
            <div className={cn(
              "flex items-start gap-4 p-4 rounded-2xl border",
              localPolicy.mode === "locked"      ? "bg-violet-50  border-violet-200"  :
              localPolicy.mode === "capped"      ? "bg-amber-50   border-amber-200"   :
              localPolicy.mode === "performance" ? "bg-emerald-50 border-emerald-200" :
                                                   "bg-sky-50     border-sky-200"
            )}>
              <Zap className={cn("w-5 h-5 mt-0.5 shrink-0",
                localPolicy.mode === "locked"      ? "text-violet-600"  :
                localPolicy.mode === "capped"      ? "text-amber-600"   :
                localPolicy.mode === "performance" ? "text-emerald-600" : "text-sky-600"
              )} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Active Policy Preview</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {localPolicy.mode === "auto"        && `Full ABR — each device selects quality up to ${localPolicy.maxQuality}, never below ${localPolicy.fallbackQuality}. Upgrades after ${localPolicy.upgradeBufferSeconds}s smooth playback.`}
                  {localPolicy.mode === "locked"      && `All endpoints locked to ${localPolicy.lockedQuality}. No ABR. Every screen in the fleet plays at exactly this quality.`}
                  {localPolicy.mode === "capped"      && `ABR enabled but capped at ${localPolicy.maxQuality}. Minimum floor: ${localPolicy.fallbackQuality}. Downgrades after ${localPolicy.stallThreshold} stall events.`}
                  {localPolicy.mode === "performance" && `Stability mode — all endpoints default to ${localPolicy.fallbackQuality} for maximum reliability. ABR disabled.`}
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Demo Mode ───────────────────────────────────────────────────── */}
        <Card className="border-amber-200 dark:border-amber-800/40 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Presentation className="w-5 h-5 text-amber-600" />
              Demo Mode
              <Badge className="ml-2 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border-amber-300 px-2 py-0.5">
                BYPASS PAIRING
              </Badge>
            </CardTitle>
            <CardDescription>
              Share the Demo Code with presenters so they can show the display client without going
              through the full pairing flow. Navigate to{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">/display?demo=YOUR_CODE</code>{" "}
              to activate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Presentation className="w-4 h-4 text-amber-600" /> Demo Access Code
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showDemoCode ? "text" : "password"}
                    value={demoCode}
                    onChange={e => setDemoCode(e.target.value.toUpperCase())}
                    className="font-mono text-sm rounded-xl pr-10 uppercase"
                    placeholder="SCREENSENSE-DEMO"
                    maxLength={32}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDemoCode(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showDemoCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={() => {
                    const demoUrl = `${window.location.origin}/display?demo=${demoCode}`;
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(demoUrl);
                      setDemoCopied(true);
                      setTimeout(() => setDemoCopied(false), 2000);
                    } else {
                      toast({
                        title: "Copy Failed",
                        description: "Your browser does not support automatic copying in this environment (likely due to insecure connection).",
                        variant: "destructive"
                      });
                    }
                  }}
                  title="Copy demo URL to clipboard"
                >
                  {demoCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Code is case-insensitive. Changes take effect after <strong>Save &amp; Apply</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-700 dark:text-amber-400">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span>
                Demo Mode shows the full display screen using the <strong>current active playlist</strong>.
                The screen is <strong>not registered</strong> as a paired device and does not appear in Fleet Management.
                Ideal for demos, stakeholder reviews, and exhibition kiosks.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Cloud Infrastructure ────────────────────────────────────────── */}
        <Card className="border-primary/10 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Server className="w-5 h-5" />
              Cloud Infrastructure & API
            </CardTitle>
            <CardDescription>
              Platform sync endpoint, device telemetry interval, session expiry, and auto-publish policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">

            <div className="space-y-2">
              <Label>Cloud Sync Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  value={syncUrl}
                  onChange={e => setSyncUrl(e.target.value)}
                  className="font-mono text-sm rounded-xl"
                  placeholder="https://api.screensense.cloud/v1"
                />
                <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-accent" /> Device Heartbeat (sec)
                </Label>
                <Input
                  type="number"
                  value={heartbeat}
                  onChange={e => setHeartbeat(e.target.value)}
                  className="rounded-xl h-11"
                  min={10} max={300}
                />
                <p className="text-[10px] text-muted-foreground">How often displays ping home</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-accent" /> Session Duration (min)
                </Label>
                <Input
                  type="number"
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(e.target.value)}
                  className="rounded-xl h-11"
                  min={5} max={480}
                />
                <p className="text-[10px] text-muted-foreground">Admin session auto-logout timeout</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Auto-Publish Updates</p>
                <p className="text-xs text-muted-foreground">
                  Push content changes to all screens automatically without manual sync.
                </p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>

          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => window.location.reload()} className="rounded-xl">
            Discard Changes
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 px-12 rounded-xl h-12 shadow-xl shadow-primary/20 bg-primary font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Apply
          </Button>
        </div>

      </div>
    </div>
  );
}
