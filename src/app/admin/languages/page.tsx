"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  RefreshCw,
  CloudSun,
  Sparkles,
  Info,
  X,
  Search,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  CloudSnow,
  Zap,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/translations";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Weather code → icon + label ─────────────────────────────────────────────

interface WeatherInfo {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function getWeatherInfo(code: number | null, manual?: string): WeatherInfo {
  if (manual === "sunny")  return { label: "Sunny",          description: "Clear sky",               icon: Sun,        color: "text-amber-500",  bg: "bg-amber-50 border-amber-200"    };
  if (manual === "cloudy") return { label: "Cloudy",         description: "Overcast clouds",          icon: CloudSun,   color: "text-slate-500",  bg: "bg-slate-50 border-slate-200"    };
  if (manual === "rainy")  return { label: "Rainy",          description: "Moderate rainfall",        icon: CloudRain,  color: "text-blue-500",   bg: "bg-blue-50 border-blue-200"      };
  if (manual === "stormy") return { label: "Stormy",         description: "Thunderstorm",             icon: Zap,        color: "text-violet-500", bg: "bg-violet-50 border-violet-200"  };
  if (code === null)       return { label: "Fetching…",      description: "Waiting for data",         icon: CloudSun,   color: "text-sky-400",    bg: "bg-sky-50 border-sky-200"        };
  if (code === 0)          return { label: "Clear Sky",      description: "Sunny & bright",           icon: Sun,        color: "text-amber-500",  bg: "bg-amber-50 border-amber-200"    };
  if (code <= 3)           return { label: "Partly Cloudy",  description: "Mixed clouds",             icon: CloudSun,   color: "text-slate-400",  bg: "bg-slate-50 border-slate-200"    };
  if (code <= 48)          return { label: "Foggy",          description: "Reduced visibility",       icon: Eye,        color: "text-gray-500",   bg: "bg-gray-50 border-gray-200"      };
  if (code <= 67)          return { label: "Rainy",          description: "Rainfall expected",        icon: CloudRain,  color: "text-blue-500",   bg: "bg-blue-50 border-blue-200"      };
  if (code <= 77)          return { label: "Snowy",          description: "Snow precipitation",       icon: CloudSnow,  color: "text-cyan-400",   bg: "bg-cyan-50 border-cyan-200"      };
  if (code <= 82)          return { label: "Heavy Rain",     description: "Intense rainfall",         icon: Droplets,   color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200"  };
  if (code <= 99)          return { label: "Thunderstorm",   description: "Lightning & rain",         icon: Zap,        color: "text-violet-600", bg: "bg-violet-50 border-violet-200"  };
  return                          { label: "Unknown",        description: "No data available",        icon: CloudSun,   color: "text-muted-foreground", bg: "bg-muted border-muted"      };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LocalizationSettings() {
  const { language, setLanguage, t } = useLanguage();
  const [stagedLanguage, setStagedLanguage] = useState<Language>(language);

  // Regional
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [units, setUnits] = useState("celsius");

  // Primary weather location
  const [weatherCity, setWeatherCity] = useState("Yogyakarta");
  const [weatherLat, setWeatherLat] = useState("-7.78");
  const [weatherLng, setWeatherLng] = useState("110.38");
  const [weatherOverride, setWeatherOverride] = useState("none"); // "none" = use live API

  // Secondary weather location
  const [weatherCitySec, setWeatherCitySec] = useState("");
  const [weatherLatSec, setWeatherLatSec] = useState("");
  const [weatherLngSec, setWeatherLngSec] = useState("");

  // City search
  const [isSearchingCity, setIsSearchingCity]       = useState(false);
  const [isSearchingCitySec, setIsSearchingCitySec] = useState(false);
  const [cityResults, setCityResults]               = useState<any[]>([]);
  const [cityResultsSec, setCityResultsSec]         = useState<any[]>([]);

  // Signage Widget Config
  const [announcementTitle, setAnnouncementTitle]       = useState("Briefing Mingguan Staf & Pengajar");
  const [announcementLocation, setAnnouncementLocation] = useState("Ruang Rapat Utama");
  const [qrUrl, setQrUrl]                               = useState("https://screensense.cloud/docs/today");

  // Live weather data for preview
  const [liveTemp, setLiveTemp]     = useState<number | null>(null);
  const [liveCode, setLiveCode]     = useState<number | null>(null);
  const [fetchingWeather, setFetchingWeather] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // ── Geocoding search ────────────────────────────────────────────────────────
  const searchCity = async (
    query: string,
    setResults: (r: any[]) => void,
    setLoading: (l: boolean) => void,
  ) => {
    if (query.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const resp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      );
      const data = await resp.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  // ── Live weather fetch (for sidebar preview) ────────────────────────────────
  const fetchLiveWeather = async (lat: string, lng: string) => {
    if (!lat || !lng) return;
    setFetchingWeather(true);
    try {
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      );
      const data = await resp.json();
      if (data?.current_weather) {
        setLiveTemp(Math.round(data.current_weather.temperature));
        setLiveCode(data.current_weather.weathercode);
      }
    } catch { /* silent */ }
    finally { setFetchingWeather(false); }
  };

  // Debounced auto-fetch when lat/lng change
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLiveWeather(weatherLat, weatherLng);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [weatherLat, weatherLng]);

  // ── Load settings from Firestore ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) {
        const d = snap.data();
        if (d.timezone)         setTimezone(d.timezone);
        if (d.timeFormat)       setTimeFormat(d.timeFormat);
        if (d.temperatureUnit)  setUnits(d.temperatureUnit);
        if (d.weatherCity)      setWeatherCity(d.weatherCity);
        if (d.weatherLat)       setWeatherLat(d.weatherLat.toString());
        if (d.weatherLng)       setWeatherLng(d.weatherLng.toString());
        if (d.weatherOverride)  setWeatherOverride(d.weatherOverride);
        if (d.weatherCitySecondary) setWeatherCitySec(d.weatherCitySecondary);
        if (d.weatherLatSecondary)  setWeatherLatSec(d.weatherLatSecondary.toString());
        if (d.weatherLngSecondary)  setWeatherLngSec(d.weatherLngSecondary.toString());
        if (d.announcementTitle)    setAnnouncementTitle(d.announcementTitle);
        if (d.announcementLocation) setAnnouncementLocation(d.announcementLocation);
        if (d.qrUrl)                setQrUrl(d.qrUrl);
      }
    };
    load();
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        timezone,
        timeFormat,
        temperatureUnit: units,
        weatherCity,
        weatherLat: parseFloat(weatherLat) || 0,
        weatherLng: parseFloat(weatherLng) || 0,
        weatherOverride,
        weatherCitySecondary: weatherCitySec,
        weatherLatSecondary:  parseFloat(weatherLatSec) || 0,
        weatherLngSecondary:  parseFloat(weatherLngSec) || 0,
        announcementTitle,
        announcementLocation,
        qrUrl,
      }, { merge: true });

      setLanguage(stagedLanguage);
      toast({
        title: "Localization Saved",
        description: "Regional settings, weather, and widgets synced to all displays.",
      });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const [mockTime, setMockTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setMockTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getMockTime = () => {
    try {
      return mockTime.toLocaleTimeString("id-ID", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: timeFormat === "24h" ? "2-digit" : undefined,
        hour12: timeFormat === "12h",
      }).replace(/\./g, ":");
    } catch { return timeFormat === "24h" ? "14:35:00" : "02:35 PM"; }
  };

  const fmtTemp = (c: number | null) => {
    if (c === null) return "—";
    if (units === "fahrenheit") return `${Math.round(c * 9 / 5 + 32)}°F`;
    return `${c}°C`;
  };

  const effectiveWeatherInfo = getWeatherInfo(
    liveCode,
    weatherOverride !== "none" ? weatherOverride : undefined
  );
  const WeatherIcon = effectiveWeatherInfo.icon;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
            <Globe className="w-10 h-10 text-accent p-2 bg-accent/10 rounded-2xl" />
            {t("nav.languages")} &amp; Regional
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Language, time, weather, and signage widget settings for all display endpoints.
          </p>
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

          {/* ── Global Presence ─────────────────────────────────────────────── */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Languages className="w-6 h-6 text-accent" />
                Global Presence
              </CardTitle>
              <CardDescription>Language, timezone, clock format, and temperature unit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Language */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    System Language
                  </Label>
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

                {/* Timezone */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Timezone (GMT offset)
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-72 overflow-y-auto">
                      {/* Pacific */}
                      <SelectItem value="Pacific/Honolulu">Honolulu (GMT−10:00)</SelectItem>
                      <SelectItem value="America/Anchorage">Anchorage (GMT−09:00)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (GMT−08:00)</SelectItem>
                      <SelectItem value="America/Denver">Denver (GMT−07:00)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (GMT−06:00)</SelectItem>
                      <SelectItem value="America/Mexico_City">Mexico City (GMT−06:00)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT−05:00)</SelectItem>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT−03:00)</SelectItem>
                      <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT−03:00)</SelectItem>
                      {/* Europe / Africa */}
                      <SelectItem value="Atlantic/Azores">Azores (GMT−01:00)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+00:00)</SelectItem>
                      <SelectItem value="Europe/Amsterdam">Amsterdam (GMT+01:00)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (GMT+01:00)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+01:00)</SelectItem>
                      <SelectItem value="Europe/Rome">Rome (GMT+01:00)</SelectItem>
                      <SelectItem value="Africa/Lagos">Lagos (GMT+01:00)</SelectItem>
                      <SelectItem value="Europe/Helsinki">Helsinki (GMT+02:00)</SelectItem>
                      <SelectItem value="Europe/Athens">Athens (GMT+02:00)</SelectItem>
                      <SelectItem value="Africa/Cairo">Cairo (GMT+02:00)</SelectItem>
                      <SelectItem value="Europe/Moscow">Moscow (GMT+03:00)</SelectItem>
                      <SelectItem value="Europe/Istanbul">Istanbul (GMT+03:00)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Riyadh (GMT+03:00)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GMT+04:00)</SelectItem>
                      <SelectItem value="Asia/Kabul">Kabul (GMT+04:30)</SelectItem>
                      <SelectItem value="Asia/Karachi">Karachi (GMT+05:00)</SelectItem>
                      <SelectItem value="Asia/Kolkata">Kolkata / Mumbai (GMT+05:30)</SelectItem>
                      <SelectItem value="Asia/Kathmandu">Kathmandu (GMT+05:45)</SelectItem>
                      <SelectItem value="Asia/Dhaka">Dhaka (GMT+06:00)</SelectItem>
                      <SelectItem value="Asia/Yangon">Yangon (GMT+06:30)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Bangkok (GMT+07:00)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Jakarta / WIB (GMT+07:00)</SelectItem>
                      <SelectItem value="Asia/Ho_Chi_Minh">Ho Chi Minh (GMT+07:00)</SelectItem>
                      <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Makassar">Makassar / WITA (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Hong Kong (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Beijing / Shanghai (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Manila">Manila (GMT+08:00)</SelectItem>
                      <SelectItem value="Asia/Jayapura">Jayapura / WIT (GMT+09:00)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+09:00)</SelectItem>
                      <SelectItem value="Asia/Seoul">Seoul (GMT+09:00)</SelectItem>
                      <SelectItem value="Australia/Darwin">Darwin (GMT+09:30)</SelectItem>
                      <SelectItem value="Australia/Brisbane">Brisbane (GMT+10:00)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (GMT+11:00)</SelectItem>
                      <SelectItem value="Pacific/Auckland">Auckland (GMT+13:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Clock format */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Clock Format
                  </Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="24h">24-Hour (HH:mm:ss)</SelectItem>
                      <SelectItem value="12h">12-Hour (hh:mm AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature unit */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Temperature Unit
                  </Label>
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

          {/* ── Weather Forecast Settings ────────────────────────────────── */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <CloudSun className="w-6 h-6 text-accent" />
                Weather Forecast Settings
                <Badge variant="outline" className="ml-1 text-[9px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 border-sky-200 px-2">
                  LIVE API · Open-Meteo
                </Badge>
              </CardTitle>
              <CardDescription>
                Set geolocations for real-time weather data displayed on all client screens. Weather is
                fetched from Open-Meteo and refreshed every 15 minutes automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">

              {/* Primary location */}
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" /> Primary Location
                </Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      value={weatherCity}
                      onChange={e => {
                        setWeatherCity(e.target.value);
                        searchCity(e.target.value, setCityResults, setIsSearchingCity);
                      }}
                      placeholder="e.g. Yogyakarta, Indonesia"
                      className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                    />
                    {isSearchingCity && <RefreshCw className="w-5 h-5 animate-spin self-center text-primary shrink-0" />}
                  </div>
                  {cityResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-primary/10 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto dark:bg-zinc-900">
                      {cityResults.map((city, i) => (
                        <button
                          key={i}
                          className="w-full px-5 py-3 text-left hover:bg-primary/5 transition-colors border-b last:border-none flex flex-col"
                          onClick={() => {
                            setWeatherCity(city.name);
                            setWeatherLat(city.latitude.toString());
                            setWeatherLng(city.longitude.toString());
                            setCityResults([]);
                            fetchLiveWeather(city.latitude.toString(), city.longitude.toString());
                          }}
                        >
                          <span className="font-bold text-sm">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {city.admin1}, {city.country} · {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Latitude</Label>
                    <Input value={weatherLat} onChange={e => setWeatherLat(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Longitude</Label>
                    <Input value={weatherLng} onChange={e => setWeatherLng(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Secondary location */}
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Secondary Location (Optional)
                </Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      value={weatherCitySec}
                      onChange={e => {
                        setWeatherCitySec(e.target.value);
                        searchCity(e.target.value, setCityResultsSec, setIsSearchingCitySec);
                      }}
                      placeholder="e.g. New York, USA"
                      className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                    />
                    {isSearchingCitySec && <RefreshCw className="w-5 h-5 animate-spin self-center text-primary shrink-0" />}
                  </div>
                  {cityResultsSec.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-primary/10 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto dark:bg-zinc-900">
                      {cityResultsSec.map((city, i) => (
                        <button
                          key={i}
                          className="w-full px-5 py-3 text-left hover:bg-primary/5 transition-colors border-b last:border-none flex flex-col"
                          onClick={() => {
                            setWeatherCitySec(city.name);
                            setWeatherLatSec(city.latitude.toString());
                            setWeatherLngSec(city.longitude.toString());
                            setCityResultsSec([]);
                          }}
                        >
                          <span className="font-bold text-sm">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {city.admin1}, {city.country}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {weatherCitySec && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Latitude</Label>
                      <Input value={weatherLatSec} onChange={e => setWeatherLatSec(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Longitude</Label>
                      <Input value={weatherLngSec} onChange={e => setWeatherLngSec(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Manual override */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Weather Override (Optional)
                </Label>
                <Select value={weatherOverride} onValueChange={setWeatherOverride}>
                  <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">None — Use Live API (Recommended)</SelectItem>
                    <SelectItem value="sunny">☀️ Force Sunny / Clear</SelectItem>
                    <SelectItem value="cloudy">🌤️ Force Cloudy</SelectItem>
                    <SelectItem value="rainy">🌧️ Force Rainy</SelectItem>
                    <SelectItem value="stormy">⛈️ Force Stormy / Thunder</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic ml-1">
                  Override replaces live data on all displays. Use "None" for real weather conditions.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* ── Signage Widget Configuration ─────────────────────────────── */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-accent" />
                Signage Widget Configuration
              </CardTitle>
              <CardDescription>
                Configure announcement banners, location context, and QR code URLs displayed
                on all client screens as part of the sidebar widget panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-8 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Announcement Title
                  </Label>
                  <Input
                    value={announcementTitle}
                    onChange={e => setAnnouncementTitle(e.target.value)}
                    className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                    placeholder="e.g. Weekly Staff Briefing"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Location Context
                  </Label>
                  <Input
                    value={announcementLocation}
                    onChange={e => setAnnouncementLocation(e.target.value)}
                    className="h-12 rounded-2xl border-primary/10 bg-muted/20"
                    placeholder="e.g. Main Conference Room"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  QR Code URL
                </Label>
                <Input
                  value={qrUrl}
                  onChange={e => setQrUrl(e.target.value)}
                  className="h-12 rounded-2xl border-primary/10 bg-muted/20 font-mono text-xs"
                  placeholder="https://your-domain.com/details"
                />
                <p className="text-[10px] text-muted-foreground italic ml-1">
                  Visitors scan this QR code on the display for more information.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Right sidebar: Live Preview ──────────────────────────────────── */}
        <div className="space-y-6 sticky top-8">
          <Card className="bg-primary/5 border-dashed border-primary/20 shadow-inner overflow-hidden rounded-[2.5rem]">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center justify-between">
                Live Display Preview
                <Badge variant="outline" className="text-[8px] bg-white border-primary/10">REAL DATA</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 gap-6">

              {/* Clock preview */}
              <div className="p-8 bg-white rounded-[2rem] shadow-2xl border border-primary/5 w-full text-center relative overflow-hidden dark:bg-zinc-900">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                <p className="text-4xl font-black text-primary tracking-tighter leading-none">{getMockTime()}</p>
                <div className="mt-3 flex items-center justify-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10">
                  <MapPin className="w-3 h-3 text-accent" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/70">
                    {weatherCity}
                  </p>
                </div>
              </div>

              {/* Live weather card */}
              <div className={`w-full rounded-2xl border p-5 transition-all ${effectiveWeatherInfo.bg}`}>
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    {fetchingWeather
                      ? <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                      : <WeatherIcon className={`w-10 h-10 ${effectiveWeatherInfo.color}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Live Weather · {weatherCity}
                    </p>
                    <p className="text-2xl font-black text-primary leading-none">
                      {fmtTemp(liveTemp)}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${effectiveWeatherInfo.color}`}>
                      {effectiveWeatherInfo.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {effectiveWeatherInfo.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchLiveWeather(weatherLat, weatherLng)}
                    className="shrink-0 p-2 rounded-xl hover:bg-white/50 transition-colors"
                    title="Refresh weather"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${fetchingWeather ? "animate-spin" : ""}`} />
                  </button>
                </div>
                {weatherOverride !== "none" && (
                  <div className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                    <Info className="w-3 h-3" /> Manual override active — live API suppressed
                  </div>
                )}
              </div>

              {/* Signage metadata */}
              <div className="w-full space-y-3 opacity-70 hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                  <Info className="w-3.5 h-3.5" /> Signage Metadata
                </div>
                <div className="bg-white/50 border border-primary/10 rounded-2xl p-4 text-[10px] font-medium space-y-2 dark:bg-zinc-900/50">
                  <div className="flex justify-between">
                    <span>Language</span><span className="font-bold">{stagedLanguage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timezone</span><span className="font-bold">{timezone.split("/").pop()?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temp Unit</span><span className="font-bold uppercase">{units === "celsius" ? "°C" : "°F"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clock Format</span><span className="font-bold">{timeFormat === "24h" ? "24-Hour" : "12-Hour"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weather Mode</span>
                    <span className="font-bold">{weatherOverride === "none" ? "Live API" : "Manual Override"}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved language change toast bar */}
      {stagedLanguage !== language && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/20 backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Unsaved language change</span>
              <span className="text-sm font-bold">Apply regional parameters now?</span>
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setStagedLanguage(language)}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                className="bg-white text-primary hover:bg-slate-100 rounded-xl font-black uppercase tracking-widest text-xs px-6"
              >
                Save &amp; Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
