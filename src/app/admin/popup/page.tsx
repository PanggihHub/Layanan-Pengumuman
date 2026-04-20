
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, 
  Info, 
  AlertTriangle, 
  Sparkles,
  Save,
  Eye,
  Trash2,
  Clock,
  Radio,
  Palette
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export default function PopupManagement() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [popupConfig, setPopupConfig] = useState({
    enabled: false,
    title: "PENGUMUMAN PENTING",
    message: "Pendaftaran Workshop AI-Powered Education di FMIPA akan segera ditutup. Segera daftarkan diri Anda di website fakultas.",
    icon: "megaphone",
    duration: 15,
    style: "blue"
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "popup"), (snap) => {
      if (snap.exists()) {
        setPopupConfig(snap.data() as any);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (forceEnable = false) => {
    setSaving(true);
    try {
      const configToSave = {
        ...popupConfig,
        enabled: forceEnable ? true : popupConfig.enabled,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, "settings", "popup"), configToSave);
      
      // Update local state if we forced enable
      if (forceEnable) {
        setPopupConfig(prev => ({ ...prev, enabled: true }));
      }

      toast({
        title: forceEnable ? t("pop.saveSuccess") : t("loc.toastSaved"),
        description: t("set.configSavedDesc"),
      });
    } catch (error) {
      console.error("Error saving popup config:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    switch (iconName) {
      case "megaphone": return <Megaphone className={size} />;
      case "info": return <Info className={size} />;
      case "alert": return <AlertTriangle className={size} />;
      case "sparkles": return <Sparkles className={size} />;
      default: return <Info className={size} />;
    }
  };

  const styles = {
    blue: "bg-blue-600 border-blue-400 text-white shadow-[0_0_50px_rgba(37,99,235,0.3)]",
    red: "bg-red-600 border-red-400 text-white shadow-[0_0_50px_rgba(220,38,38,0.3)]",
    emerald: "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_50px_rgba(16,185,129,0.3)]",
    amber: "bg-amber-600 border-amber-400 text-white shadow-[0_0_50px_rgba(245,158,11,0.3)]",
    zinc: "bg-zinc-900 border-zinc-700 text-white shadow-[0_0_50px_rgba(24,24,27,0.3)]",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight flex items-center gap-3">
            <Megaphone className="w-10 h-10" />
            {t("pop.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{t("pop.desc")}</p>
        </div>
        <Button 
          onClick={() => handleSave(false)} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {t("common.saveApply")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">{t("pop.status")}</CardTitle>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm">
                  <span className={cn("text-xs font-black uppercase tracking-widest", popupConfig.enabled ? "text-emerald-600" : "text-muted-foreground")}>
                    {popupConfig.enabled ? t("common.active") : t("common.inactive")}
                  </span>
                  <Switch 
                    checked={popupConfig.enabled} 
                    onCheckedChange={async (val) => {
                      setPopupConfig(prev => ({ ...prev, enabled: val }));
                      // Auto-save toggle state for instant fleet-wide impact
                      try {
                        await setDoc(doc(db, "settings", "popup"), {
                          ...popupConfig,
                          enabled: val,
                          updatedAt: serverTimestamp()
                        });
                        toast({
                          title: val ? t("common.active") : t("common.inactive"),
                          description: val ? t("pop.broadcastInitiated") : t("pop.broadcastRemoved"),
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    }} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("pop.message")}</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">{t("pop.titleField")}</Label>
                    <input 
                      type="text" 
                      value={popupConfig.title}
                      onChange={(e) => setPopupConfig(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-bold"
                      placeholder={t("pop.titlePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">{t("pop.messageField")}</Label>
                    <Textarea 
                      value={popupConfig.message}
                      onChange={(e) => setPopupConfig(prev => ({ ...prev, message: e.target.value }))}
                      className="min-h-[140px] bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl p-4 outline-none transition-all resize-none leading-relaxed"
                      placeholder={t("pop.messagePlaceholder")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Palette className="w-4 h-4" /> {t("pop.style")}
                  </Label>
                  <Select value={popupConfig.style} onValueChange={(val) => setPopupConfig(prev => ({ ...prev, style: val }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none transition-all hover:bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                    <SelectItem value="blue" className="rounded-lg">{t("pop.profBlue")}</SelectItem>
                    <SelectItem value="red" className="rounded-lg text-red-600 font-bold">{t("pop.crisisRed")}</SelectItem>
                    <SelectItem value="emerald" className="rounded-lg text-emerald-600 font-bold">{t("pop.successGreen")}</SelectItem>
                    <SelectItem value="amber" className="rounded-lg text-amber-600 font-bold">{t("pop.warnAmber")}</SelectItem>
                    <SelectItem value="zinc" className="rounded-lg font-black">{t("pop.minDark")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    {getIcon(popupConfig.icon, "w-4 h-4")} {t("pop.iconField")}
                  </Label>
                  <Select value={popupConfig.icon} onValueChange={(val) => setPopupConfig(prev => ({ ...prev, icon: val }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none transition-all hover:bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                      <SelectItem value="megaphone" className="rounded-lg">{t("pop.megaphoneIcon")}</SelectItem>
                      <SelectItem value="info" className="rounded-lg">{t("pop.infoIcon")}</SelectItem>
                      <SelectItem value="alert" className="rounded-lg">{t("pop.alertIcon")}</SelectItem>
                      <SelectItem value="sparkles" className="rounded-lg">{t("pop.sparklesIcon")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {t("pop.duration")}
                  </Label>
                  <Badge variant="outline" className="font-mono text-primary border-primary/20">
                    {popupConfig.duration === 0 ? t("pop.persistent") : `${popupConfig.duration}s`}
                  </Badge>
                </div>
                <Slider 
                  value={[popupConfig.duration]} 
                  max={60} 
                  step={5} 
                  onValueChange={(val) => setPopupConfig(prev => ({ ...prev, duration: val[0] }))}
                  className="py-4"
                />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {t("pop.durationDesc")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
              <Eye className="w-4 h-4" />
              {t("pop.preview")}
            </div>
            
            <div className="aspect-[4/3] w-full bg-zinc-950 rounded-[2rem] overflow-hidden shadow-2xl relative border-[8px] border-zinc-900 group">
              {/* Fake Display Content */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Display-04 Active</span>
              </div>
              
              {/* The Actual Popup Preview */}
              <div className={cn(
                "absolute inset-0 z-50 flex items-center justify-center p-8 transition-all duration-500",
                popupConfig.enabled ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"
              )}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                
                <div className={cn(
                  "relative w-full rounded-[1.5rem] border-2 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-700",
                  styles[popupConfig.style as keyof typeof styles] || styles.blue
                )}>
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-white/20" />
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                      {getIcon(popupConfig.icon, "w-6 h-6 text-white")}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-tighter uppercase leading-none truncate">
                        {popupConfig.title || "ANNOUNCEMENT"}
                      </h3>
                      <div className="h-1 w-12 bg-white/40 rounded-full" />
                      <p className="text-sm font-bold leading-relaxed opacity-90 line-clamp-4">
                        {popupConfig.message || t("pop.previewPlaceholder")}
                      </p>
                    </div>
                  </div>
                  
                  {popupConfig.enabled && popupConfig.duration > 0 && (
                    <div className="h-1.5 bg-white/10 flex items-center justify-start overflow-hidden">
                      <div 
                        className="h-full bg-white animate-shrink" 
                        style={{ 
                          width: '100%',
                          animationDuration: `${popupConfig.duration}s`,
                          animationIterationCount: 'infinite',
                          animationTimingFunction: 'linear'
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {!popupConfig.enabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20 z-[60]">
                  <Megaphone className="w-12 h-12" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("pop.disabledOverlay")}</span>
                </div>
              )}
            </div>

            <Card className="bg-primary border-none shadow-xl shadow-primary/20 overflow-hidden">
               <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Radio className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <p className="text-white font-black tracking-tighter uppercase leading-none text-xl">{t("pop.fleetBroadcast")}</p>
                     <p className="text-white/60 text-xs font-medium mt-1 uppercase tracking-widest">{t("pop.globalSync")}</p>
                   </div>
                 </div>
                 <p className="text-white/40 text-[10px] mt-6 leading-relaxed font-medium">
                   {t("pop.broadcastNotice")}
                 </p>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation-name: shrink;
        }
      `}</style>
    </div>
  );
}
