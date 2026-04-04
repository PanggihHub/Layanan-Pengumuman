"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Globe, 
  Languages, 
  MapPin, 
  Clock, 
  Thermometer, 
  Save,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function LocalizationSettings() {
  const [lang, setLang] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC-5");
  const [units, setUnits] = useState("celsius");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: lang === "id-ID" ? "Sistem Diperbarui" : "System Language Updated",
        description: lang === "id-ID" 
          ? `Lokalisasi diubah ke Bahasa Indonesia. Seluruh platform diterjemahkan.`
          : `Localization changed to ${lang}. Entire platform translated.`,
      });
    }, 1500);
  };

  // Simplified greeting for the preview mockup
  const getGreeting = () => {
    switch(lang) {
      case "zh-CN": return "欢迎 (Welcome)";
      case "ja-JP": return "ようこそ (Welcome)";
      case "es-ES": return "Bienvenidos";
      case "fr-FR": return "Bienvenue";
      case "id-ID": return "Selamat Datang";
      case "en-GB": return "Welcome";
      default: return "Welcome";
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Globe className="w-8 h-8 text-accent" />
          Localization & Language Suite
        </h1>
        <p className="text-muted-foreground mt-2">Adjust linguistic and environmental parameters across the display network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Languages className="w-5 h-5" />
                Language & System Dialect
              </CardTitle>
              <CardDescription>Select the interface language for dashboard and displays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Primary System Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="id-ID">Bahasa Indonesia</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified) - 中文</SelectItem>
                    <SelectItem value="ja-JP">Japanese - 日本語</SelectItem>
                    <SelectItem value="es-ES">Spanish - Español</SelectItem>
                    <SelectItem value="fr-FR">French - Français</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">Updating this will instantly translate all menu labels and dashboard modules.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/10 shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Thermometer className="w-5 h-5" />
                Environmental Metrics (TU)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Temperature Units</Label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                Time & Regional Clock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Fleet Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (PT)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (ET)</SelectItem>
                    <SelectItem value="UTC+0">London (GMT)</SelectItem>
                    <SelectItem value="UTC+1">Paris (CET)</SelectItem>
                    <SelectItem value="UTC+7">Jakarta / Bangkok (WIB)</SelectItem>
                    <SelectItem value="UTC+8">Beijing / Singapore (CST)</SelectItem>
                    <SelectItem value="UTC+9">Tokyo / Seoul (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-dashed border-primary/20 shadow-inner overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
                Live Interface Mockup
                <Badge variant="outline" className="text-[8px] bg-white">PREVIEW</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8 h-48">
              <div className="p-8 bg-white rounded-2xl shadow-xl border w-full text-center">
                 <h4 className="text-4xl font-black text-primary tracking-tighter">
                   {getGreeting()}
                 </h4>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button size="lg" className="px-16 gap-3 h-14 text-lg font-bold shadow-lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          Publish Regional Updates
        </Button>
      </div>
    </div>
  );
}
