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
  
  // Display Controls (Master Defaults)
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>(SCREEN_SETTINGS.displayLayout);

  // Weather Settings
  const [weatherCity, setWeatherCity] = useState(SCREEN_SETTINGS.weatherCity);
  const [weatherLat, setWeatherLat] = useState(SCREEN_SETTINGS.weatherLat.toString());
  const [weatherLng, setWeatherLng] = useState(SCREEN_SETTINGS.weatherLng.toString());
  const [weatherCitySec, setWeatherCitySec] = useState(SCREEN_SETTINGS.weatherCitySecondary);
  const [weatherLatSec, setWeatherLatSec] = useState(SCREEN_SETTINGS.weatherLatSecondary.toString());
  const [weatherLngSec, setWeatherLngSec] = useState(SCREEN_SETTINGS.weatherLngSecondary.toString());

  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isSearchingCitySec, setIsSearchingCitySec] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setWeatherCity(d.weatherCity || "Yogyakarta");
        setWeatherLat(d.weatherLat?.toString() || "-7.78");
        setWeatherLng(d.weatherLng?.toString() || "110.38");
        setWeatherCitySec(d.weatherCitySecondary || "New York");
        setWeatherLatSec(d.weatherLatSecondary?.toString() || "40.71");
        setWeatherLngSec(d.weatherLngSecondary?.toString() || "-74.00");
        setDisplayLayout(d.displayLayout || "single");
        setSyncUrl(d.syncUrl || "https://api.screensense.cloud/v1");
        setHeartbeat(d.heartbeat?.toString() || "60");
        setSessionTimeout(d.sessionTimeout?.toString() || "30");
        setAutoUpdate(d.autoUpdate ?? true);
      }
    });
    return unsub;
  }, []);

  const searchCity = async (query: string, setResults: (res: any[]) => void, setLoading: (l: boolean) => void) => {
    if (query.length < 3) return;
    setLoading(true);
    try {
      const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await resp.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setLoading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    
    await setDoc(doc(db, "settings", "global"), {
      displayLayout,
      weatherCity,
      weatherLat: parseFloat(weatherLat),
      weatherLng: parseFloat(weatherLng),
      weatherCitySecondary: weatherCitySec,
      weatherLatSecondary: parseFloat(weatherLatSec),
      weatherLngSecondary: parseFloat(weatherLngSec),
      syncUrl,
      heartbeat: parseInt(heartbeat),
      sessionTimeout: parseInt(sessionTimeout),
      autoUpdate
    }, { merge: true });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration Saved",
        description: "Global system parameters and display settings updated.",
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

        {/* Weather Configuration Card */}
        <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CloudSun className="w-5 h-5 text-accent" />
              Weather & Forecast Settings
            </CardTitle>
            <CardDescription>Customize the geographic targets for the real-time weather widgets.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Primary Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                  <MapPin className="w-4 h-4" /> Primary Location (Main)
                </div>
                <div className="space-y-2 relative">
                  <Label>Search City</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={weatherCity} 
                      onChange={e => {
                        setWeatherCity(e.target.value);
                        searchCity(e.target.value, setCitySearchResults, setIsSearchingCity);
                      }} 
                      placeholder="e.g. Yogyakarta" 
                      className="rounded-xl" 
                    />
                    {isSearchingCity && <RefreshCw className="w-4 h-4 animate-spin self-center" />}
                  </div>
                  {citySearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-primary/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {citySearchResults.map((city, i) => (
                        <button
                          key={i}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-primary/5 transition-colors border-b last:border-none flex flex-col"
                          onClick={() => {
                            setWeatherCity(city.name);
                            setWeatherLat(city.latitude.toString());
                            setWeatherLng(city.longitude.toString());
                            setCitySearchResults([]);
                          }}
                        >
                          <span className="font-bold">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground">{city.admin1}, {city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 opacity-50">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Latitude</Label>
                    <div className="h-10 px-3 flex items-center bg-muted/20 border rounded-xl text-xs font-mono text-muted-foreground">
                      {weatherLat}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Longitude</Label>
                    <div className="h-10 px-3 flex items-center bg-muted/20 border rounded-xl text-xs font-mono text-muted-foreground">
                      {weatherLng}
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <Globe className="w-4 h-4" /> Secondary Location (Global)
                </div>
                <div className="space-y-2 relative">
                  <Label>Search City</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={weatherCitySec} 
                      onChange={e => {
                        setWeatherCitySec(e.target.value);
                        searchCity(e.target.value, setCitySearchResultsSec, setIsSearchingCitySec);
                      }} 
                      placeholder="e.g. New York" 
                      className="rounded-xl" 
                    />
                    {isSearchingCitySec && <RefreshCw className="w-4 h-4 animate-spin self-center" />}
                  </div>
                  {citySearchResultsSec.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-primary/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {citySearchResultsSec.map((city, i) => (
                        <button
                          key={i}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-primary/5 transition-colors border-b last:border-none flex flex-col"
                          onClick={() => {
                            setWeatherCitySec(city.name);
                            setWeatherLatSec(city.latitude.toString());
                            setWeatherLngSec(city.longitude.toString());
                            setCitySearchResultsSec([]);
                          }}
                        >
                          <span className="font-bold">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground">{city.admin1}, {city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 opacity-50">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Latitude</Label>
                    <div className="h-10 px-3 flex items-center bg-muted/20 border rounded-xl text-xs font-mono text-muted-foreground">
                      {weatherLatSec}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Longitude</Label>
                    <div className="h-10 px-3 flex items-center bg-muted/20 border rounded-xl text-xs font-mono text-muted-foreground">
                      {weatherLngSec}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-dashed text-[10px] text-muted-foreground flex gap-3 items-start">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p>The weather widget uses high-precision GPS coordinates to fetch local conditions. Ensure the City Name matches your administrative location records for consistency.</p>
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
                <Input type="number" value={heartbeat} onChange={e => setHeartbeat(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cloud className="w-4 h-4 text-accent" /> Session Duration (Min)</Label>
                <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="rounded-xl" />
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
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8 rounded-xl h-11 shadow-lg shadow-primary/20">
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
            Apply Global Config
          </Button>
        </div>
      </div>
    </div>
  );
}
