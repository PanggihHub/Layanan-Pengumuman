"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Languages, 
  MapPin, 
  Clock, 
  Thermometer, 
  Save,
  CheckCircle2,
  RefreshCw,
  CloudSun,
  Sparkles,
  Info,
  X,
  Layers,
  Search
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

import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/translations";

import { useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

export default function LocalizationSettings() {
  const { language, setLanguage, t } = useLanguage();
  const [stagedLanguage, setStagedLanguage] = useState<Language>(language);
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [units, setUnits] = useState("celsius");
  
  // Weather state
  const [weatherCity, setWeatherCity] = useState("Yogyakarta");
  const [weatherLat, setWeatherLat] = useState("-7.78");
  const [weatherLng, setWeatherLng] = useState("110.38");
  const [weatherCitySec, setWeatherCitySec] = useState("New York");
  const [weatherLatSec, setWeatherLatSec] = useState("40.71");
  const [weatherLngSec, setWeatherLngSec] = useState("-74.00");
  const [weatherStatus, setWeatherStatus] = useState("sunny");
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isSearchingCitySec, setIsSearchingCitySec] = useState(false);
  const [citySearchResults, setCitySearchResults] = useState<any[]>([]);
  const [citySearchResultsSec, setCitySearchResultsSec] = useState<any[]>([]);

  // Widget Settings
  const [announcementTitle, setAnnouncementTitle] = useState("Briefing Mingguan Staf & Pengajar");
  const [announcementLocation, setAnnouncementLocation] = useState("Ruang Rapat Utama");
  const [qrUrl, setQrUrl] = useState("https://screensense.cloud/docs/today");

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    const loadSettings = async () => {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) {
        const data = snap.data();
        if (data.timezone) setTimezone(data.timezone);
        if (data.timeFormat) setTimeFormat(data.timeFormat);
        if (data.temperatureUnit) setUnits(data.temperatureUnit);
        
        if (data.weatherStatus) setWeatherStatus(data.weatherStatus);
        if (data.weatherCity) setWeatherCity(data.weatherCity);
        if (data.weatherLat) setWeatherLat(data.weatherLat.toString());
        if (data.weatherLng) setWeatherLng(data.weatherLng.toString());
        
        if (data.announcementTitle) setAnnouncementTitle(data.announcementTitle);
        if (data.announcementLocation) setAnnouncementLocation(data.announcementLocation);
        if (data.qrUrl) setQrUrl(data.qrUrl);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await setDoc(doc(db, "settings", "global"), {
        timezone,
        timeFormat,
        temperatureUnit: units,
        weatherCity,
        weatherLat: parseFloat(weatherLat),
        weatherLng: parseFloat(weatherLng),
        weatherCitySecondary: weatherCitySec,
        weatherLatSecondary: parseFloat(weatherLatSec),
        weatherLngSecondary: parseFloat(weatherLngSec),
        weatherStatus,
        announcementTitle,
        announcementLocation,
        qrUrl
      }, { merge: true });

      setLanguage(stagedLanguage);
      setIsSaving(false);
      toast({
        title: stagedLanguage === "id-ID" ? "Sistem Diperbarui" : "System Config Updated",
        description: stagedLanguage === "id-ID" 
          ? `Lokalisasi dan Widget diubah.`
          : `Localization and Widgets updated.`,
      });
    } catch(err) {
      setIsSaving(false);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setStagedLanguage(language);
    toast({
      title: "Cancelled",
      description: "Language changes have been reverted.",
    });
  };

  const getGreeting = () => {
    switch(stagedLanguage) {
      case "id-ID": return "Selamat Datang";
      case "en-US": return "Welcome";
      case "en-AU": return "G'day";
      case "en-GB": return "Welcome";
      case "en-SG": return "Welcome lah";
      case "ms-MY": return "Selamat Datang";
      case "pt-BR": return "Bem-vindo";
      case "es-MX": return "Bienvenido";
      case "fi-FI": return "Tervetuloa";
      case "tr-TR": return "Hoş Geldiniz";
      case "th-TH": return "ยินดีต้อนรับ";
      default: return "Welcome";
    }
  }

  const [mockTime, setMockTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setMockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMockupTime = () => {
    try {
      return mockTime.toLocaleTimeString('id-ID', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: timeFormat === '24h' ? '2-digit' : undefined,
        hour12: timeFormat === '12h'
      }).replace(/\./g, ':');
    } catch(err) {
      return timeFormat === '24h' ? '14:35:00' : '02:35 PM';
    }
  };

  const getMockupWeather = () => {
    const temps = units === "celsius" ? "32°C" : "89°F";
    let statusLabel = "";
    switch(weatherStatus) {
      case "sunny": statusLabel = "Sunny"; break;
      case "cloudy": statusLabel = "Cloudy"; break;
      case "rainy": statusLabel = "Rainy"; break;
      case "stormy": statusLabel = "Stormy"; break;
    }
    return `${statusLabel} | ${temps}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
            <Globe className="w-10 h-10 text-accent p-2 bg-accent/10 rounded-2xl" />
            {t("nav.languages")} & Regional
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Configure presence, units, and regional signage parameters.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-14 px-10 rounded-[1.25rem] bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs gap-3 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {language === "id-ID" ? "SIMPAN & TERAPKAN" : "SAVE & APPLY CHANGES"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
               <CardTitle className="text-xl font-bold flex items-center gap-3">
                 <Languages className="w-6 h-6 text-accent" />
                 Global Presence
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">System Language</Label>
                  <Select value={stagedLanguage} onValueChange={(v: Language) => setStagedLanguage(v)}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="en-US">English (United States)</SelectItem>
                      <SelectItem value="en-AU">English (Australia)</SelectItem>
                      <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                      <SelectItem value="en-SG">English (Singapore)</SelectItem>
                      <SelectItem value="id-ID">Bahasa Indonesia</SelectItem>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="es-MX">Español (México)</SelectItem>
                      <SelectItem value="fi-FI">Suomi (Finland)</SelectItem>
                      <SelectItem value="tr-TR">Türkçe (Turkey)</SelectItem>
                      <SelectItem value="th-TH">ไทย (Thai)</SelectItem>
                      <SelectItem value="ms-MY">Bahasa Melayu (Malaysia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Timezone (GMT Mapping)</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Asia/Jakarta">Jakarta (GMT+07:00)</SelectItem>
                      <SelectItem value="Asia/Makassar">Makassar (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Jayapura">Jayapura (GMT+09:00)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Bangkok (GMT+07:00)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+00:00)</SelectItem>
                      <SelectItem value="Europe/Helsinki">Helsinki (GMT+02:00)</SelectItem>
                      <SelectItem value="Europe/Istanbul">Istanbul (GMT+03:00)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-05:00)</SelectItem>
                      <SelectItem value="America/Sao_Paulo">Sao Paulo (GMT-03:00)</SelectItem>
                      <SelectItem value="America/Mexico_City">Mexico City (GMT-06:00)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (GMT+11:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Clock Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="24h">24 Hour (HH:mm:ss)</SelectItem>
                      <SelectItem value="12h">12 Hour (hh:mm AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Temperature Unit</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={units === "celsius" ? "default" : "outline"} 
                    onClick={() => setUnits("celsius")} 
                    className="flex-1 h-12 rounded-2xl font-bold"
                  >
                    Celsius (°C)
                  </Button>
                  <Button 
                    variant={units === "fahrenheit" ? "default" : "outline"} 
                    onClick={() => setUnits("fahrenheit")} 
                    className="flex-1 h-12 rounded-2xl font-bold"
                  >
                    Fahrenheit (°F)
                  </Button>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <CloudSun className="w-6 h-6 text-accent" />
                Weather Geolocation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">
              <div className="space-y-4 relative">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Location Search</Label>
                <div className="flex gap-2">
                  <Input 
                    value={weatherCity} 
                    onChange={e => {
                      setWeatherCity(e.target.value);
                      searchCity(e.target.value, setCitySearchResults, setIsSearchingCity);
                    }} 
                    placeholder="e.g. Yogyakarta, Indonesia" 
                    className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                  />
                  {isSearchingCity && <RefreshCw className="w-5 h-5 animate-spin self-center text-primary" />}
                </div>
                {citySearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-primary/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {citySearchResults.map((city, i) => (
                      <button
                        key={i}
                        className="w-full px-5 py-3 text-left hover:bg-primary/5 transition-colors border-b last:border-none flex flex-col"
                        onClick={() => {
                          setWeatherCity(city.name);
                          setWeatherLat(city.latitude.toString());
                          setWeatherLng(city.longitude.toString());
                          setCitySearchResults([]);
                        }}
                      >
                        <span className="font-bold text-sm">{city.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{city.admin1}, {city.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-accent" />
                Signage Widgets Config
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Announcement Title</Label>
                  <Input 
                    value={announcementTitle} 
                    onChange={e => setAnnouncementTitle(e.target.value)} 
                    className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Location Context</Label>
                  <Input 
                    value={announcementLocation} 
                    onChange={e => setAnnouncementLocation(e.target.value)} 
                    className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">QR Multi-Sync URL</Label>
                <Input 
                  value={qrUrl} 
                  onChange={e => setQrUrl(e.target.value)} 
                  className="h-12 rounded-2xl border-primary/10 bg-muted/20 font-mono text-xs"
                />
              </div>

               <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Manually Overwrite Weather Status</Label>
                  <Select value={weatherStatus} onValueChange={setWeatherStatus}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="sunny">Sunny / Clear</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="stormy">Stormy / Thunder</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic ml-1">Force a specific weather state for aesthetic consistency or testing.</p>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-primary/5 border-dashed border-primary/20 shadow-inner overflow-hidden rounded-[2.5rem] sticky top-8">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center justify-between">
                Dynamic Integration Preview
                <Badge variant="outline" className="text-[8px] bg-white border-primary/10">MOCKED HUD</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 gap-6 h-auto">
              <div className="p-8 bg-white rounded-[2rem] shadow-2xl border border-primary/5 w-full text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-accent/10 transition-colors" />
                 <h4 className="text-4xl font-black text-primary tracking-tighter leading-none mb-1">
                   {getGreeting()}
                 </h4>
                 <div className="mt-6 flex flex-col items-center gap-1">
                   <p className="text-2xl font-mono font-black text-slate-800 tracking-tighter">{getMockupTime()}</p>
                   <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                     <MapPin className="w-3 h-3 text-accent" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary/70">
                       {weatherCity}
                     </p>
                   </div>
                 </div>
              </div>

              <div className="p-5 bg-white shadow-xl rounded-2xl w-full flex items-center justify-center gap-3 border border-primary/5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CloudSun className="w-6 h-6 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Climate Condition</p>
                  <p className="text-base font-black text-primary tracking-tight leading-none">{getMockupWeather()}</p>
                </div>
              </div>

              <div className="w-full space-y-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">
                     <Info className="w-4 h-4" /> Signage Metadata
                  </div>
                  <div className="bg-white/50 border border-primary/10 rounded-2xl p-4 text-[10px] font-medium space-y-2">
                      <div className="flex justify-between"><span>Region</span><span className="font-bold">{stagedLanguage}</span></div>
                      <div className="flex justify-between"><span>Timezone</span><span className="font-bold">{timezone}</span></div>
                      <div className="flex justify-between"><span>HW Sync</span><span className="font-bold uppercase">Ready</span></div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {stagedLanguage !== language && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-primary text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/20 backdrop-blur-xl">
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Unsaved Changes detected</span>
               <span className="text-sm font-bold">Apply regional parameters now?</span>
             </div>
             <div className="flex gap-4">
                <Button variant="ghost" onClick={handleCancel} className="text-white hover:bg-white/10 rounded-xl">Discard</Button>
                <Button onClick={handleSave} className="bg-white text-primary hover:bg-slate-100 rounded-xl font-black uppercase tracking-widest text-xs px-6">Save & Sync</Button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
