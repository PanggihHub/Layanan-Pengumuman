"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        title: "Localization Updated",
        description: "Regional settings published to all devices.",
      });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Globe className="w-8 h-8 text-accent" />
          Localization & Regional Settings
        </h1>
        <p className="text-muted-foreground mt-2">Adjust linguistic and environmental display parameters across the network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-accent" />
                Language & Dialect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Primary Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish (ES)</SelectItem>
                    <SelectItem value="fr-FR">French (FR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-accent" />
                Environmental Units
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Temperature Display</Label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Time & Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Fleet Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (PT)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (ET)</SelectItem>
                    <SelectItem value="UTC+0">London (GMT)</SelectItem>
                    <SelectItem value="UTC+1">Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-dashed border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Preview Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Live Display Mockup</p>
                <div className="flex justify-between items-baseline">
                  <h4 className="text-2xl font-bold">
                    {timezone === "UTC-5" ? "14:45" : "19:45"}
                  </h4>
                  <span className="text-emerald-600 font-bold">
                    {units === "celsius" ? "24°C" : "75°F"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button size="lg" className="px-12 gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          Publish Regional Update
        </Button>
      </div>
    </div>
  );
}
