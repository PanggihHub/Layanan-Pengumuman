"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  CloudSun,
  Clock,
  MapPin,
  Megaphone,
  QrCode,
  CalendarDays,
  Sparkles,
  Info,
  Calendar,
  Waves,
  ShieldAlert,
  ArrowLeft,
  Monitor,
  Loader2,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, getDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Playlist, MediaItem, ScreenStatus, TickerMessage, WorshipSchedule } from "@/lib/mock-data";
import { useQuality } from "@/context/QualityContext";
import { AdaptiveVideoPlayer } from "@/components/ui/adaptive-video-player";
import { SmartTicker } from "@/components/ui/smart-ticker";
import { sortSchedulesByNextPrayer, getTimeUntil } from "@/lib/worship-importer";
import { useLanguage } from "@/context/LanguageContext";
import { Language, translations } from "@/lib/translations";

// Helper to get or create device ID
const getDeviceId = () => {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("screensense_device_id");
  if (!id) {
    id = "DISP-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem("screensense_device_id", id);
  }
  return id;
};

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

// Unified Temperature formatter moved into component to access state

// Hardcoded fallback demo code (overridden by Firestore settings/global.demoCode)
const FALLBACK_DEMO_CODE = "SCREENSENSE-DEMO";

export default function DisplayClient() {
  const [deviceId] = useState(() => getDeviceId());
  const [isPaired, setIsPaired] = useState<boolean | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [tickerFallback, setTickerFallback] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [isLocked, setIsLocked] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(true);

  const { policy, resolveQuality } = useQuality();

  // Dynamic Widget States
  const [worshipSchedules, setWorshipSchedules] = useState<WorshipSchedule[]>([]);
  const [nowMinutes, setNowMinutes] = useState<number>(0);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementLocation, setAnnouncementLocation] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [locationName, setLocationName] = useState("Signage Point");

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const [weatherStatus, setWeatherStatusData] = useState<string | null>(null);
  const [weatherCity, setWeatherCity] = useState("Jakarta");
  const [weatherLat, setWeatherLat] = useState<number | null>(-6.2088);
  const [weatherLng, setWeatherLng] = useState<number | null>(106.8456);
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius");

  const [weatherCitySec, setWeatherCitySec] = useState("");
  const [weatherLatSec, setWeatherLatSec] = useState<number | null>(null);
  const [weatherLngSec, setWeatherLngSec] = useState<number | null>(null);
  const [weatherTempSec, setWeatherTempSec] = useState<number | null>(null);
  const [weatherCodeSec, setWeatherCodeSec] = useState<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isOffline, setIsOffline] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    enabled: false,
    title: "",
    message: "",
    icon: "megaphone",
    duration: 15,
    style: "blue",
    updatedAt: null as any
  });
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState<any>(null);

  const { t, setLanguage, language: currentLang } = useLanguage();

  // ── Demo Mode Check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo");
    if (!demoParam) return;

    // Check against Firestore-configured code, fall back to hardcoded constant
    getDoc(doc(db, "settings", "global")).then((snap) => {
      const data = snap.data();
      const configuredCode: string = snap.exists()
        ? (data?.demoCode || FALLBACK_DEMO_CODE)
        : FALLBACK_DEMO_CODE;

      if (demoParam.trim().toUpperCase() === configuredCode.trim().toUpperCase()) {
        setIsDemoMode(true);
        setIsPaired(true);      // bypass pairing gate
        setLocationName("Demo Mode");
        
        // Also sync language for demo mode
        if (data?.language) {
          setLanguage(data.language as Language);
        }
      }
    }).catch(() => {
      // If Firestore is unreachable, still allow hardcoded fallback
      if (demoParam.trim().toUpperCase() === FALLBACK_DEMO_CODE) {
        setIsDemoMode(true);
        setIsPaired(true);
        setLocationName("Demo Mode");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Offline status detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync Firestore Database
    const unsubPlaylists = onSnapshot(collection(db, "playlists"), (snap) => {
      const items: Playlist[] = [];
      snap.forEach((doc) => items.push(doc.data() as Playlist));
      setPlaylists(items);
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const items: MediaItem[] = [];
      snap.forEach((doc) => items.push(doc.data() as MediaItem));
      setMediaItems(items);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        // Legacy single-string ticker (used as fallback if no queue entries)
        setTickerFallback(data.tickerMessage || "");
        setActivePlaylistId(data.activePlaylistId || "");
        setTimezone(data.timezone || "Asia/Jakarta");
        setIsLocked(data.isPanicLocked || false);
        setAnnouncementTitle(data.announcementTitle || "Briefing Mingguan Staf & Pengajar");
        setAnnouncementLocation(data.announcementLocation || "Ruang Rapat Utama");
        setQrUrl(data.qrUrl || "https://screensense.cloud/docs/today");

        if (data.weatherCity) setWeatherCity(data.weatherCity);
        if (data.weatherLat) setWeatherLat(Number(data.weatherLat));
        if (data.weatherLng) setWeatherLng(Number(data.weatherLng));
        if (data.weatherStatus) setWeatherStatusData(data.weatherStatus);

        if (data.weatherCitySec) setWeatherCitySec(data.weatherCitySec);
        if (data.weatherLatSec) setWeatherLatSec(Number(data.weatherLatSec));
        if (data.weatherLngSec) setWeatherLngSec(Number(data.weatherLngSec));

        if (data.temperatureUnit) setTemperatureUnit(data.temperatureUnit);
        if (data.timeFormat) setTimeFormat(data.timeFormat);
        if (data.language) {
           setLanguage(data.language as Language);
        }

        // Fleet Sync - Reload trigger
        if (data.lastFleetSync) {
          const syncTime = data.lastFleetSync?.toMillis?.() || (data.lastFleetSync?.seconds * 1000);
          if (lastSyncTime !== null && syncTime > lastSyncTime) {
            console.log("Fleet sync triggered. Reloading...");
            window.location.reload();
          }
          setLastSyncTime(syncTime);
        }
      }
    });

    const unsubPopup = onSnapshot(doc(db, "settings", "popup"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setPopupConfig(data);
        setShowOverlay(data.enabled);
        
        // If there's a duration (non-zero), handle auto-hide
        // Note: In a real-world multi-display setup, we'd might want to 
        // handle 'lastBroadcastAt' to ensure the timer starts fresh.
      } else {
        setShowOverlay(false);
      }
    });

    // Ticker message queue — real-time, priority-sorted
    const unsubTicker = onSnapshot(
      query(collection(db, "tickerMessages"), orderBy("createdAt", "asc")),
      (snap) => {
        setTickerMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as TickerMessage)));
      }
    );

    const unsubEmergency = onSnapshot(doc(db, "settings", "emergency"), (snap) => {
      if (snap.exists()) {
        setEmergencyAlert(snap.data());
      } else {
        setEmergencyAlert(null);
      }
    });

    const unsubWorship = onSnapshot(collection(db, "worship"), (snap) => {
      const items: WorshipSchedule[] = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as WorshipSchedule))
        .filter(s => s.active !== false);
      // Initial sort by time; display re-sorts by next-prayer every minute
      setWorshipSchedules(items);
    });

    // Minute ticker for next-prayer sorting
    const updateNow = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    updateNow();
    const minuteTick = setInterval(updateNow, 60_000);

    // Pairing & Authorization System (skipped if demo mode already activated)
    const unsubScreen = onSnapshot(doc(db, "screens", deviceId), async (snap) => {
      // If demo mode was already activated via URL param, don't override isPaired
      setIsDemoMode((dm) => {
        if (dm) return dm; // already in demo, ignore screen doc changes
        if (snap.exists()) {
          setIsPaired(true);
          setPairingCode(null);
          const data = snap.data();
          if (data?.location) setLocationName(data.location);
        } else {
          setIsPaired(false);
          setPairingCode((prev) => {
            if (!prev) {
              const newCode = Math.floor(100000 + Math.random() * 900000).toString();
              const now = new Date();
              setDoc(doc(db, "pairingCodes", deviceId), {
                deviceId,
                code: newCode,
                // Store timestamp TWO ways: Firestore Timestamp (for ordering)
                // and ISO string (for admin cleanup queries)
                timestamp: serverTimestamp(),
                createdAt: now.toISOString(),
                expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(), // 15 min TTL
              }).catch(console.error);
              return newCode;
            }
            return prev;
          });
        }
        return dm;
      });
    });

    // Heartbeat System
    const heartbeat = setInterval(async () => {
      try {
        await updateDoc(doc(db, "screens", deviceId), {
          lastSeen: new Date().toISOString(),
          status: "Online",
          uptime: "Active",
        });
      } catch (e) {
        // Document might not exist if not paired yet
      }
    }, 30000); // 30 seconds Pulse

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubPlaylists();
      unsubMedia();
      unsubSettings();
      unsubWorship();
      unsubTicker();
      unsubPopup();
      unsubEmergency();
      unsubScreen();
      clearInterval(heartbeat);
      clearInterval(minuteTick);
    };
  }, []);

  const handleVerifyCode = async () => {
    if (inputCode.length < 4) return;
    setIsVerifying(true);
    setPairError(null);

    try {
      const pairId = `PAUSE-${inputCode}`;
      const pairDoc = await getDoc(doc(db, "adminInitiatedPairing", pairId));

      if (pairDoc.exists()) {
        const data = pairDoc.data();
        if (data) {
          await setDoc(doc(db, "screens", deviceId), {
            id: deviceId,
            name: data.name ?? "Display",
            playlistId: data.playlistId ?? "",
            status: "Waiting",
            location: data.location ?? "Manual Link",
            uptime: "0h",
            lastSeen: new Date().toISOString()
          });
          await deleteDoc(doc(db, "adminInitiatedPairing", pairId));
        }
      } else {
        setPairError("Invalid or expired pairing code. Please check the code and try again.");
      }
    } catch (err) {
      console.error(err);
      setPairError("Connection error. Please check your network and try again.");
    } finally {
      setIsVerifying(false);
      setInputCode("");
    }
  };

  // Auto-hide back button
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const handleActivity = () => {
      setShowBackButton(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowBackButton(false);
      }, 5000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Initial timeout
    timeoutRef.current = setTimeout(() => {
      setShowBackButton(false);
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const loopItems = useMemo(() => {
    if (!activePlaylist) return [];
    return activePlaylist.items
      .map(id => mediaItems.find(m => m.id === id))
      .filter((m): m is MediaItem => !!m);
  }, [activePlaylist, mediaItems]);

  // Fetch weather automatically
  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        if (weatherLat && weatherLng) {
          const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLng}&current_weather=true`);
          const data = await resp.json();
          if (data && data.current_weather && isMounted) {
            setWeatherTemp(Math.round(data.current_weather.temperature));
            setWeatherCode(data.current_weather.weathercode);
          }
        }
        if (weatherLatSec && weatherLngSec) {
          const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherLatSec}&longitude=${weatherLngSec}&current_weather=true`);
          const data = await resp.json();
          if (data && data.current_weather && isMounted) {
            setWeatherTempSec(Math.round(data.current_weather.temperature));
            setWeatherCodeSec(data.current_weather.weathercode);
          }
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    fetchWeather();
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [weatherLat, weatherLng, weatherLatSec, weatherLngSec]);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Popup Auto-hide logic
  useEffect(() => {
    if (showOverlay && popupConfig.duration > 0) {
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, popupConfig.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay, popupConfig.duration, popupConfig.updatedAt]);

  useEffect(() => {
    if (loopItems.length <= 1) return;

    // Default loop time is 8 seconds, but video config allows overriding via DB (future feature)
    // Here we check if the current media enforces a duration. For now, 8s baseline.
    const currentMedia = loopItems[currentIndex];

    // If it's a video with timeline trims, play for that long length.
    let duration = 8000;
    if (currentMedia?.type === 'video' && currentMedia?.startTime != null && currentMedia?.endTime != null) {
      duration = (currentMedia.endTime - currentMedia.startTime) * 1000;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loopItems.length);
    }, duration);
    return () => clearInterval(interval);
  }, [loopItems, currentIndex]);

  // Temperature formatter — reads unit from Localization settings
  const fmtTemp = (tempC: number | null): string => {
    if (tempC === null) return "—";
    if (temperatureUnit === "fahrenheit") return `${Math.round(tempC * 9 / 5 + 32)}°F`;
    return `${Math.round(tempC)}°C`;
  };

  // YouTube quality param derived from global policy
  const ytQualityParam = useMemo(() => {
    const resolved = resolveQuality('1080p'); // ask policy what quality to use for HD content
    if (resolved === '480p') return 'large';
    if (resolved === '720p') return 'hd720';
    if (resolved === '4K' || resolved === '8K') return 'hd2160';
    return 'hd1080'; // 1080p default
  }, [resolveQuality]);

  const getWeatherStatus = (code: number | null, manualStatus?: string | null) => {
    // Priority 1: Manual status from settings
    if (manualStatus) {
      if (manualStatus === 'sunny') return "Cerah (Sunny)";
      if (manualStatus === 'cloudy') return "Berawan (Cloudy)";
      if (manualStatus === 'rainy') return "Hujan (Rainy)";
      if (manualStatus === 'stormy') return "Badai (Stormy)";
      return manualStatus.toUpperCase();
    }

    // Priority 2: Real-time code calculation
    if (code === null) return t("loc.weatherWait");
    if (code === 0) return t("loc.weatherSunny");
    if (code >= 1 && code <= 3) return t("loc.weatherCloudy");
    if (code >= 45 && code <= 48) return t("loc.weatherFoggy");
    if (code >= 51 && code <= 67) return t("loc.weatherRainy");
    if (code >= 71 && code <= 77) return t("loc.weatherSnowy");
    if (code >= 80 && code <= 82) return t("loc.weatherHeavyRain");
    if (code >= 95) return t("loc.weatherStormy");
    return t("loc.weatherUnknown");
  };

  if (isPaired === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (isPaired === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-sans text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-zinc-950 z-0 pointer-events-none" />
        <button
          onClick={() => window.history.back()}
          className={cn(
            "absolute top-8 left-8 z-50 text-white/50 hover:text-white transition flex items-center space-x-2 duration-500",
            showBackButton ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          )}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Exit</span>
        </button>

        <div className="relative z-10 bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] text-center max-w-2xl w-full shadow-2xl">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-500/20">
            <Monitor className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Device Pairing</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Connect this screen to the FMIPA e-Board network using one of the two methods below.
          </p>

          {/* ── Method 1: Broadcast code shown to admin ── */}
          <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-6 mb-5 text-left">
            <p className="text-[10px] text-blue-400 uppercase tracking-[0.25em] font-black mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
              Method 1 — Admin Pairs This Screen
            </p>
            <p className="text-[11px] text-zinc-500 mb-5">
              Give the admin the code below. They enter it under{" "}
              <span className="font-bold text-zinc-300">Screens → Link Unit / Pair Device</span>.
            </p>
            <div className="flex items-center justify-center gap-2 my-3">
              {(pairingCode || "------").split("").map((char, i) => (
                <div key={i} className="w-11 h-14 bg-black/60 border border-blue-500/30 rounded-xl flex items-center justify-center text-3xl font-black font-mono text-blue-400 shadow-inner">
                  {char}
                </div>
              ))}
            </div>
            <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest font-bold mt-3">
              Valid 15 min · Refreshes on page reload
            </p>
          </div>

          {/* ── Method 2: Enter admin-generated code ── */}
          <div className="bg-zinc-800/40 border border-white/10 rounded-2xl p-6 text-left">
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.25em] font-black mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
              Method 2 — Enter Admin-Generated Code
            </p>
            <p className="text-[11px] text-zinc-500 mb-5">
              Ask your admin to generate a code from{" "}
              <span className="font-bold text-zinc-300">Screens → Link Unit</span>, then type it here.
            </p>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                maxLength={8}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase());
                  setPairError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && inputCode.length >= 4 && !isVerifying && handleVerifyCode()}
                className={cn(
                  "flex-1 bg-black/50 border rounded-xl px-5 py-3 text-center text-2xl font-black font-mono focus:outline-none transition-colors tracking-[0.2em]",
                  pairError
                    ? "border-red-500/60 text-red-400 focus:border-red-400"
                    : "border-white/20 text-white focus:border-blue-500"
                )}
                placeholder="000000"
                autoComplete="off"
              />
              <button
                onClick={handleVerifyCode}
                disabled={isVerifying || inputCode.length < 4}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            {pairError && (
              <div className="mt-4 flex items-start gap-2.5 bg-red-950/50 border border-red-500/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Info className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300 font-medium leading-snug text-left">{pairError}</p>
              </div>
            )}
          </div>

          <p className="text-zinc-700 text-[9px] font-mono uppercase tracking-widest mt-6">
            Device ID: {deviceId}
          </p>
        </div>
      </div>
    );
  }

  if (emergencyAlert?.activeAlertId) {
    const { protocol } = emergencyAlert;
    return (
      <div className={cn(
        "w-screen h-screen flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700 relative overflow-hidden",
        protocol?.color || 'bg-red-600'
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
        <div className="relative z-10 flex flex-col items-center max-w-5xl">
          <AlertTriangle className="w-40 h-40 text-white mb-10 animate-bounce drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
          <h1 className="text-8xl font-black text-white tracking-tighter uppercase drop-shadow-2xl leading-none mb-10">
            {protocol?.label || "Emergency"}
          </h1>
          <div className="h-2 w-48 bg-white/40 rounded-full mb-10" />
          <p className="text-4xl font-bold text-white uppercase tracking-tight leading-tight drop-shadow-xl">
            {protocol?.text}
          </p>

          <div className="mt-20 flex items-center gap-6 text-sm font-black uppercase tracking-[0.3em] text-white/40">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" /> EMERGENCY_OVERRIDE</div>
            <span className="opacity-50">|</span>
            <div>UNIT_ID: {deviceId}</div>
          </div>
        </div>

        {/* Glossy Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent animate-pulse" />
        </div>
        <ShieldAlert className="w-32 h-32 text-red-600 mb-8 animate-bounce" />
        <h1 className="text-7xl font-black text-red-600 tracking-tighter uppercase">System Secured</h1>
        <p className="text-white/60 text-2xl mt-4 max-w-2xl font-medium">All visual output has been terminated by emergency override. Contact security operations for manual restoration code.</p>
        <div className="mt-12 flex items-center gap-4 text-xs font-mono text-white/20">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> SECURE_HANDSHAKE_ACTIVE</div>
          <span className="opacity-50">|</span>
          <div className="font-bold">LOCKOUT_ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>

        {/* Persistent Back Button for Navigation */}
        <button
          onClick={() => window.location.href = "/"}
          className={cn(
            "fixed top-8 left-8 z-[100] h-14 w-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-95",
            showBackButton ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          )}
          title="Back to Home"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>
    );
  }

  if (!activePlaylist || loopItems.length === 0) {
    // Premium Default Dashboard (Clock + Weather)
    return (
      <div className="w-screen h-screen bg-zinc-950 flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-zinc-950 z-0" />

        {/* Floating background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
          <Sparkles className="w-16 h-16 text-indigo-400 mb-12 animate-pulse" />

          <div className="space-y-4">
            <h2 className="text-[12rem] font-black tracking-tighter leading-none tabular-nums text-white drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: timeFormat === '24h' ? '2-digit' : undefined, hour12: timeFormat === '12h' }).replace(/\./g, ':')}
            </h2>
            <p className="text-4xl font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="mt-20 flex gap-12 w-full px-12 justify-center">
            {weatherTemp !== null && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl flex-1 max-w-[300px]">
                <CloudSun className="w-16 h-16 text-amber-400" />
                <div className="flex flex-col items-center text-center">
                  <span className="text-6xl font-black leading-none">{fmtTemp(weatherTemp)}</span>
                  <span className="text-lg font-bold text-white/50 uppercase tracking-widest mt-2 px-2 truncate w-full">{weatherCity || locationName}</span>
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">{getWeatherStatus(weatherCode)}</span>
                </div>
              </div>
            )}
            {weatherTempSec !== null && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl flex-1 max-w-[300px]">
                <CloudSun className="w-16 h-16 text-amber-400 opacity-80" />
                <div className="flex flex-col items-center text-center">
                  <span className="text-6xl font-black leading-none">{fmtTemp(weatherTempSec)}</span>
                  <span className="text-lg font-bold text-white/50 uppercase tracking-widest mt-2 px-2 truncate w-full">{weatherCitySec}</span>
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">{getWeatherStatus(weatherCodeSec)}</span>
                </div>
              </div>
            )}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl flex-1 max-w-[300px]">
              <Waves className="w-16 h-16 text-emerald-400" />
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black leading-none flex items-center gap-2">98<span className="text-xl font-bold opacity-50">%</span></span>
                <span className="text-lg font-bold text-white/50 uppercase tracking-widest mt-2 text-center">Network<br />Health</span>
              </div>
            </div>
          </div>

          <div className="mt-24 py-4 px-8 bg-zinc-900/50 border border-white/5 rounded-full backdrop-blur-sm flex items-center gap-3 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-sm font-bold tracking-widest uppercase text-white/40">Broadcasting Services Online</span>
          </div>
        </div>

        {/* Persistent Back Button */}
        <button
          onClick={() => window.location.href = "/"}
          className={cn(
            "fixed top-8 left-8 z-[100] h-16 w-16 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-95 shadow-2xl group",
            showBackButton ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          )}
          title="Back to Home"
        >
          <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  const currentMedia = loopItems[currentIndex];
  const layout = activePlaylist.layout || 'single';
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const renderMediaContent = (mediaCls: string, mediaItem?: MediaItem | null) => {
    const itemToRender = mediaItem || currentMedia;
    if (!itemToRender) {
      return (
        <div className={cn("w-full h-full flex flex-col items-center justify-center bg-zinc-900 border-[3px] border-dashed border-white/20", mediaCls)}>
          <Info className="w-16 h-16 text-white/20 mb-4" />
          <span className="text-white/40 font-black uppercase tracking-widest text-lg">NO SOURCE</span>
        </div>
      );
    }
    const youtubeId = (itemToRender.type === 'external_video' || itemToRender.source === "external") ? extractYouTubeId(itemToRender.url) : null;

    if (itemToRender.type === "website") {
      return (
        <iframe
          src={itemToRender.url}
          className={cn("w-full h-full border-none pointer-events-none bg-white", mediaCls)}
          title="Website Content"
        />
      );
    }

    if (itemToRender.type === "video" || youtubeId) {
      if (youtubeId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=${itemToRender.startTime || 0}&end=${itemToRender.endTime || 0}&vq=${ytQualityParam}&rel=0`}
            className={cn("w-full h-full object-cover pointer-events-none", mediaCls)}
            frameBorder="0"
            allow="autoplay; fullscreen"
          />
        );
      } else {
        // Use AdaptiveVideoPlayer for policy-aware playback
        return (
          <AdaptiveVideoPlayer
            item={itemToRender}
            autoPlay
            loop
            controls={false}
            className={cn("w-full h-full", mediaCls)}
          />
        );
      }
    } else {
      return (
        <Image
          src={itemToRender.url}
          alt={itemToRender.name || "Media"}
          fill
          className={cn("object-cover", mediaCls)}
          unoptimized
        />
      );
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-sans text-white">

      {/* Demo Mode Badge */}
      {isDemoMode && (
        <div className="absolute top-4 right-4 z-[200] flex items-center gap-2 bg-amber-500/90 backdrop-blur-md text-black px-4 py-2 rounded-full shadow-2xl border border-amber-400/60 animate-in slide-in-from-top-4 duration-700">
          <Monitor className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Demo Mode</span>
        </div>
      )}

      {/* Overlay Notification System */}
      {showOverlay && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className={cn(
            "w-[65vw] h-auto min-h-[45vh] border-[4px] border-white/20 rounded-[4rem] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-1000",
            popupConfig.style === 'red' ? 'bg-red-700 shadow-[0_0_150px_rgba(220,38,38,0.5)]' :
            popupConfig.style === 'emerald' ? 'bg-emerald-700 shadow-[0_0_150px_rgba(16,185,129,0.5)]' :
            popupConfig.style === 'amber' ? 'bg-amber-600 shadow-[0_0_150px_rgba(245,158,11,0.5)]' :
            popupConfig.style === 'zinc' ? 'bg-zinc-950 shadow-[0_0_150px_rgba(0,0,0,0.8)]' :
            'bg-blue-700 shadow-[0_0_150px_rgba(29,78,216,0.5)]'
          )}>
            {/* Glossy accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-white/20" />
            
            <div className="flex-1 p-[5vw] flex items-center gap-[5vw]">
              <div className="w-[15vw] h-[15vw] bg-white/10 rounded-full flex items-center justify-center shrink-0 border-4 border-white/20 shadow-inner">
                {popupConfig.icon === 'megaphone' && <Megaphone className="w-[8vw] h-[8vw] text-white" />}
                {popupConfig.icon === 'info' && <Info className="w-[8vw] h-[8vw] text-white" />}
                {popupConfig.icon === 'alert' && <AlertTriangle className="w-[8vw] h-[8vw] text-white" />}
                {popupConfig.icon === 'sparkles' && <Sparkles className="w-[8vw] h-[8vw] text-white" />}
              </div>
              <div className="space-y-[3vh] flex-1">
                <h3 className="text-[4vw] font-black text-white tracking-tighter uppercase leading-[0.9] drop-shadow-lg">
                  {popupConfig.title || "ANNOUNCEMENT"}
                </h3>
                <div className="h-2 w-32 bg-white/40 rounded-full" />
                <p className="text-[2.2vw] font-bold text-white/90 leading-[1.3] drop-shadow-lg">
                  {popupConfig.message}
                </p>
              </div>
            </div>

            {popupConfig.duration > 0 && (
              <div className="h-4 bg-black/20 flex items-center justify-start overflow-hidden">
                 <div 
                   className="h-full bg-white/40" 
                   style={{ 
                     animation: `progress-shrink ${popupConfig.duration}s linear forwards` 
                   }} 
                 />
              </div>
            )}
            
            <style jsx>{`
              @keyframes progress-shrink {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Offline Banner Indicator */}
      {isOffline && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] bg-orange-500/90 backdrop-blur text-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Offline Mode • Local Cache Active</span>
        </div>
      )}


      {/* Dynamic Background Blur */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl z-10" />
        {currentMedia?.type !== 'video' && currentMedia?.source !== 'external' && currentMedia && (
          <Image
            src={currentMedia.url || '/placeholder.png'}
            alt=""
            fill
            className="object-cover opacity-30 blur-2xl scale-110"
            unoptimized
          />
        )}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col p-6 gap-6">

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 min-h-0">

          {/* Main Display Grid */}
            <div className={cn(
              "flex-1 relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black/50 backdrop-blur-sm",
              layout === 'grid-2x2' ? 'grid grid-cols-2 grid-rows-2 gap-1 p-1' :
              layout === 'split-v' ? 'grid grid-cols-2 gap-1 p-1' :
              layout === 'split-h' ? 'grid grid-rows-2 gap-1 p-1' : 
              layout === 'dashboard-split' ? 'flex flex-row p-0 gap-0 border-none' : 'block'
            )}>

            {/* DASHBOARD SPLIT LAYOUT (60/40) */}
            {layout === 'dashboard-split' && (
              <>
                {/* Left Side (60%) - Main Announcements */}
                <div className="w-[60%] h-full relative overflow-hidden bg-zinc-950 border-r-2 border-white/5">
                  <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-1000">
                    {renderMediaContent("w-full h-full")}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    {/* Adaptive Typography Content */}
                    <div className="absolute bottom-[4vh] left-[3vw] right-[3vw] space-y-[2vh]">
                      <div className="inline-flex items-center gap-[0.8vw] bg-blue-600 px-[1.2vw] py-[0.5vw] rounded-full">
                        <Megaphone className="w-[1.5vw] h-[1.5vw] text-white" />
                        <span className="text-[1.2vw] font-black uppercase tracking-[0.2em]">{currentMedia?.category || "PENGUMUMAN"}</span>
                      </div>
                      <h2 className="text-[5vw] font-black tracking-tight leading-[1.1] text-white grow drop-shadow-2xl">
                        {currentMedia?.name}
                      </h2>
                      {currentMedia?.description && (
                        <p className="text-[2vw] font-medium text-white/70 leading-relaxed line-clamp-2">
                          {currentMedia.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side (40%) - Static Info Panel */}
                <div className="w-[40%] h-full flex flex-col bg-zinc-900 overflow-hidden">
                  {/* Digital Clock Section */}
                  <div className="flex-1 flex flex-col items-center justify-center p-[4vw] bg-gradient-to-b from-blue-900/20 to-transparent">
                    <div className="text-center space-y-[0.5vh]">
                      <h3 className="text-[8vw] font-black tabular-nums tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':')}
                      </h3>
                      <p className="text-[2.2vw] font-black text-blue-400 uppercase tracking-[0.3em]">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long' })}
                      </p>
                      <p className="text-[1.8vw] font-bold text-white/40 uppercase tracking-widest">
                        {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Notifications List Section */}
                  <div className="h-[45vh] bg-black/40 backdrop-blur-3xl p-[3vw] border-t-2 border-white/5 space-y-[3vh]">
                    <h4 className="text-[1.2vw] font-black text-white/30 uppercase tracking-[0.4em] mb-[2vh]">NOTIFIKASI TERKINI</h4>
                    <div className="space-y-[2vh]">
                      <div className="bg-white/5 border-l-4 border-blue-500 p-[2vw] rounded-r-2xl transform hover:scale-[1.02] transition-transform duration-300">
                        <p className="text-[1.4vw] font-black text-white leading-tight">Ujian Tengah Semester Ganjil</p>
                        <p className="text-[1.1vw] text-white/50 mt-[0.5vh]">Sesuai jadwal di kalender akademik.</p>
                      </div>
                      <div className="bg-white/5 border-l-4 border-emerald-500 p-[2vw] rounded-r-2xl transform hover:scale-[1.02] transition-transform duration-300">
                        <p className="text-[1.4vw] font-black text-white leading-tight">Pendaftaran Beasiswa Unggulan</p>
                        <p className="text-[1.1vw] text-white/50 mt-[0.5vh]">Batas akhir pengumpulan berkas 20 April.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SINGLE LAYOUT */}
            {layout === 'single' && (
              <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-1000">
                {renderMediaContent("")}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <Badge className="bg-accent text-primary px-3 py-1 text-sm font-black uppercase tracking-widest mb-3 border-none">
                    {currentMedia?.category}
                  </Badge>
                  <h2 className="text-6xl font-black tracking-tighter drop-shadow-2xl capitalize leading-none">
                    {currentMedia?.name}
                  </h2>
                  {currentMedia?.description && (
                    <p className="text-xl font-medium text-white/80 mt-4 max-w-3xl leading-relaxed">
                      {currentMedia.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SPLITS / GRID LAYOUTS */}
            {layout !== 'single' && (
              <>
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/50">
                  {renderMediaContent("")}
                  {currentMedia && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6 pointer-events-none">
                      <h3 className="text-3xl font-black leading-tight drop-shadow-xl">{currentMedia.name}</h3>
                    </div>
                  )}
                </div>
                {layout.includes('split') && (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/50">
                    {(() => {
                      const offsetItem = 1 >= loopItems.length ? null : loopItems[(currentIndex + 1) % loopItems.length];
                      return (
                        <>
                          {renderMediaContent("", offsetItem)}
                          {offsetItem && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6 pointer-events-none">
                              <h3 className="text-3xl font-black leading-tight drop-shadow-xl">
                                {offsetItem.name}
                              </h3>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                {layout === 'grid-2x2' && [1, 2, 3].map(offset => {
                  const item = offset >= loopItems.length ? null : loopItems[(currentIndex + offset) % loopItems.length];
                  return (
                    <div key={offset} className="relative w-full h-full rounded-2xl overflow-hidden bg-black/50">
                      {renderMediaContent("", item)}
                      {item && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6 pointer-events-none">
                          <h3 className="text-2xl font-black leading-tight drop-shadow-xl">{item.name}</h3>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          {(activePlaylist.showInfoCard || activePlaylist.showWorship || activePlaylist.showQR) && (
            <div className="w-[22vw] min-w-[280px] flex flex-col gap-5 max-h-full overflow-y-auto no-scrollbar transition-all duration-500">

              {/* Time & Weather */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-center items-center relative overflow-hidden shadow-2xl transition-all duration-700 hover:bg-black/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Clock className="w-48 h-48" />
                </div>
                
                <div className="flex flex-col items-center">
                  <h2 className="text-7xl font-black tracking-tighter tabular-nums drop-shadow-[0_8px_30px_rgba(255,255,255,0.1)] mb-1">
                    {currentTime.toLocaleTimeString('id-ID', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' }).replace(/\./g, ':')}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase">
                      {currentTime.toLocaleDateString('id-ID', { timeZone: timezone, weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-white/5 w-full">
                  {weatherTemp !== null && (() => {
                    const status = getWeatherStatus(weatherCode, weatherStatus);
                    return (
                      <div className="flex items-center gap-4 w-full bg-white/[0.03] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="p-3 bg-amber-400/10 rounded-2xl">
                          <CloudSun className={cn("w-8 h-8 text-amber-400", status.includes("Hujan") && "text-blue-400", status.includes("Badai") && "text-purple-400")} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-4xl font-black leading-none text-white tracking-tighter">
                            {fmtTemp(weatherTemp)}
                          </span>
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1.5 truncate">
                            {weatherCity || locationName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {weatherTempSec !== null && (
                    <div className="flex items-center gap-4 w-full bg-white/[0.01] p-4 rounded-3xl border border-white/5 border-dashed">
                      <CloudSun className="w-8 h-8 text-amber-400/40 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-2xl font-black leading-none text-white/60">
                          {fmtTemp(weatherTempSec)}
                        </span>
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 truncate">
                          {weatherCitySec}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Worship Highlight Widget — Compact Only */}
              {activePlaylist.showWorship && (() => {
                const sorted = sortSchedulesByNextPrayer(worshipSchedules, nowMinutes);
                if (!sorted.length) return null;
                const next = sorted[0];
                const until = getTimeUntil(next.time);
                
                return (
                  <div className="bg-emerald-600 text-white rounded-[2rem] p-4 shadow-2xl relative overflow-hidden border border-emerald-500/50">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Waves className="w-4 h-4 text-emerald-300" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/70">{t("scr.activeLoop")}</span>
                      </div>
                      <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md uppercase tracking-widest text-white">
                        {until === "Now" ? t("common.live") : until}
                      </span>
                    </div>
                    
                    <div className="flex items-end justify-between relative z-10">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-0.5 truncate drop-shadow-md">{next.name}</h3>
                        <p className="text-[9px] font-bold text-emerald-100/50 uppercase tracking-widest truncate">{next.location || "Main Hall"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black tabular-nums tracking-tighter drop-shadow-lg">{next.time}</span>
                      </div>
                    </div>

                    <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
                      <Waves className="w-48 h-48" />
                    </div>
                  </div>
                );
              })()}

              {/* Upcoming Event Info */}
              {activePlaylist.showInfoCard && announcementTitle && (
                <div className="bg-white text-primary rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-muted-foreground/50 mb-3 text-[10px] font-black uppercase tracking-widest">
                    <Info className="w-4 h-4 text-accent" />
                    {t("common.papan_informasi")}
                  </div>
                  <h3 className="font-black text-lg leading-tight text-primary">{announcementTitle}</h3>
                  {announcementLocation && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-primary/60 mt-3 bg-primary/5 p-2 rounded-xl">
                      <MapPin className="w-3.5 h-3.5" /> {announcementLocation}
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Sync */}
              {activePlaylist.showQR && qrUrl && (
                <div className="bg-accent/10 backdrop-blur-md rounded-3xl p-4 border border-accent/20 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    <QrCode className="w-12 h-12 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black uppercase text-accent tracking-tighter">{t("pl.details")}</h4>
                    <p className="text-[9px] text-white/70 leading-tight mt-1 font-medium truncate">{qrUrl.replace(/^https?:\/\//, '')}</p>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Global Ticker — SmartTicker with priority queue */}
        {activePlaylist.showTicker && (
          <SmartTicker
            messages={tickerMessages}
            fallback={tickerFallback}
            speedPxPerSec={90}
            height={56}
            textSize="text-xl"
            className="shrink-0 rounded-2xl shadow-2xl"
          />
        )}

      </div>

      {/* Persistent Back Button for Navigation */}
      <button
        onClick={() => window.location.href = "/"}
        className={cn(
          "fixed top-8 left-8 z-[100] h-16 w-16 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-95 shadow-2xl group",
          showBackButton ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
        title="Back to Home"
      >
        <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
