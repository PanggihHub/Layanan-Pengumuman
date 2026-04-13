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
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { Playlist, MediaItem, ScreenStatus } from "@/lib/mock-data";

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

export default function DisplayClient() {
  const [isPaired, setIsPaired] = useState<boolean | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [tickerMessage, setTickerMessage] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [isLocked, setIsLocked] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackButton, setShowBackButton] = useState(true);

  // Dynamic Widget States
  const [worshipSchedules, setWorshipSchedules] = useState<any[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementLocation, setAnnouncementLocation] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const [weatherStatus, setWeatherStatusData] = useState<string | null>(null);
  const [weatherCity, setWeatherCity] = useState("Jakarta");
  const [weatherLat, setWeatherLat] = useState<number | null>(-6.2088);
  const [weatherLng, setWeatherLng] = useState<number | null>(106.8456);
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);

  const [weatherCitySec, setWeatherCitySec] = useState("");
  const [weatherLatSec, setWeatherLatSec] = useState<number | null>(null);
  const [weatherLngSec, setWeatherLngSec] = useState<number | null>(null);
  const [weatherTempSec, setWeatherTempSec] = useState<number | null>(null);
  const [weatherCodeSec, setWeatherCodeSec] = useState<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isOffline, setIsOffline] = useState(false);

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
        setTickerMessage(data.tickerMessage || "");
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
        
        if (data.timeFormat) setTimeFormat(data.timeFormat);
      }
    });

    const unsubWorship = onSnapshot(collection(db, "worship"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.active !== false && !data.hidden) {
          items.push({ id: doc.id, ...data });
        }
      });
      // Sort by time
      items.sort((a, b) => a.time.localeCompare(b.time));
      setWorshipSchedules(items);
    });

    const deviceId = getDeviceId();

    // Pairing & Authorization System
    const unsubScreen = onSnapshot(doc(db, "screens", deviceId), async (snap) => {
      if (snap.exists()) {
        setIsPaired(true);
        setPairingCode(null);
      } else {
        setIsPaired(false);
        setPairingCode((prev) => {
          if (!prev) {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            setDoc(doc(db, "pairingCodes", deviceId), {
              deviceId,
              code: newCode,
              timestamp: serverTimestamp()
            }).catch(console.error);
            return newCode;
          }
          return prev;
        });
      }
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
      unsubScreen();
      clearInterval(heartbeat);
    };
  }, []);

  const handleVerifyCode = async () => {
    if (inputCode.length !== 6) return;
    setIsVerifying(true);
    
    try {
      const pairId = `PAUSE-${inputCode}`;
      const pairDoc = await getDoc(doc(db, "adminInitiatedPairing", pairId));
      
      if (pairDoc.exists()) {
        const data = pairDoc.data();
        if (data) {
          // Create full screen record
          await setDoc(doc(db, "screens", deviceId), {
            id: deviceId,
            name: data.name,
            playlistId: data.playlistId,
            status: "Waiting",
            location: "Manual Link",
            uptime: "0h",
            lastSeen: new Date().toISOString()
          });
          
          // Cleanup the pairing code
          await deleteDoc(doc(db, "adminInitiatedPairing", pairId));
        }
      } else {
        alert("Invalid or expired pairing code.");
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    if (loopItems.length <= 1) return;
    
    // Default loop time is 8 seconds, but video config allows overriding via DB (future feature)
    // Here we check if the current media enforces a duration. For now, 8s baseline.
    const currentMedia = loopItems[currentIndex];
    
    // If it's a video with timeline trims, play for that long length.
    let duration = 8000;
    if (currentMedia?.type === 'video' && currentMedia?.startTime !== undefined && currentMedia?.endTime !== undefined) {
      duration = (currentMedia.endTime - currentMedia.startTime) * 1000;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loopItems.length);
    }, duration);
    return () => clearInterval(interval);
  }, [loopItems, currentIndex]);

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

        <div className="relative z-10 bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-16 rounded-[2rem] text-center max-w-2xl w-full shadow-2xl">
          <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-blue-500/20">
            <QrCode className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Display Connection</h1>
          <p className="text-xl text-zinc-400 mb-12">
            Either input the code from your Admin Dashboard below, or use the code broadcasted by this screen:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-8 shadow-inner flex flex-col items-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-black">Broadcast Code</p>
              <p className="text-5xl font-mono tracking-tighter text-blue-400 font-black">{pairingCode || "......"}</p>
              <p className="text-[9px] text-zinc-600 mt-4 uppercase font-bold">Waiting for remote pair...</p>
            </div>
            
            <div className="bg-zinc-800/40 border border-white/10 rounded-2xl p-8 shadow-inner flex flex-col items-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-black">Enter Admin Code</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="bg-black/50 border border-white/20 rounded-xl px-4 py-2 w-32 text-center text-2xl font-black font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="000000"
                />
                <button 
                  onClick={handleVerifyCode}
                  disabled={isVerifying || inputCode.length !== 6}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[9px] text-zinc-600 mt-4 uppercase font-bold">Manual connection override</p>
            </div>
          </div>
          
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic opacity-30 mt-4">
            Device System ID: {deviceId}
          </p>
        </div>
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
                  <span className="text-6xl font-black leading-none">{`${weatherTemp}°C`}</span>
                  <span className="text-lg font-bold text-white/50 uppercase tracking-widest mt-2 px-2 truncate w-full">{weatherCity || locationName}</span>
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">{getWeatherStatus(weatherCode)}</span>
                </div>
              </div>
            )}
            {weatherTempSec !== null && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl flex-1 max-w-[300px]">
                <CloudSun className="w-16 h-16 text-amber-400 opacity-80" />
                <div className="flex flex-col items-center text-center">
                  <span className="text-6xl font-black leading-none">{`${weatherTempSec}°C`}</span>
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

  // Extract location name gracefully (e.g. Asia/Makassar => Makassar)
  const locationName = timezone.split('/')[1]?.replace('_', ' ') || 'Jakarta';

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
    if (code === null) return "Loading...";
    if (code === 0) return "Cerah (Sunny)";
    if (code >= 1 && code <= 3) return "Berawan (Cloudy)";
    if (code >= 45 && code <= 48) return "Berkabut (Foggy)";
    if (code >= 51 && code <= 67) return "Hujan (Rainy)";
    if (code >= 71 && code <= 77) return "Salju (Snow)";
    if (code >= 80 && code <= 82) return "Hujan Deras (Heavy Rain)";
    if (code >= 95) return "Badai Petir (Thunderstorm)";
    return "Unknown";
  };

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
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=${itemToRender.startTime || 0}&end=${itemToRender.endTime || 0}&vq=hd720&rel=0`} 
            className={cn("w-full h-full object-cover pointer-events-none", mediaCls)} 
            frameBorder="0" 
            allow="autoplay; fullscreen" 
          />
        );
      } else {
        // Render raw video with trimming
        return (
          <video 
            src={itemToRender.url} 
            className={cn("w-full h-full object-cover", mediaCls)} 
            autoPlay 
            muted 
            loop 
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              if (itemToRender.startTime) video.currentTime = itemToRender.startTime;
            }}
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              if (itemToRender.endTime && video.currentTime >= itemToRender.endTime) {
                video.currentTime = itemToRender.startTime || 0;
              }
            }}
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
            layout === 'split-h' ? 'grid grid-rows-2 gap-1 p-1' : 'block'
          )}>
            
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
            <div className="w-96 flex flex-col gap-6 shrink-0">
              
              {/* Time & Weather */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                   <Clock className="w-48 h-48" />
                 </div>
                 <h2 className="text-7xl font-black tracking-tighter tabular-nums drop-shadow-lg">
                  {currentTime.toLocaleTimeString('id-ID', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: timeFormat === '24h' ? '2-digit' : undefined, hour12: timeFormat === '12h' }).replace(/\./g, ':')}
                 </h2>
                 <p className="text-accent text-lg font-bold tracking-widest uppercase mt-2">
                  {currentTime.toLocaleDateString('id-ID', { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric' })}
                 </p>
                 <div className="flex flex-col items-center gap-6 mt-8 pt-8 border-t border-white/10 w-full justify-center">
                    {weatherTemp !== null && (
                      <div className="flex items-center gap-4 w-full bg-black/20 p-4 rounded-2xl">
                        <CloudSun className="w-10 h-10 text-yellow-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-3xl font-black leading-none text-white">
                            {`${weatherTemp}°`}
                          </span>
                          <span className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1 truncate">
                            {weatherCity || locationName}
                          </span>
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                            {getWeatherStatus(weatherCode, weatherStatus)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {weatherTempSec !== null && (
                      <div className="flex items-center gap-4 w-full bg-black/20 p-4 rounded-2xl">
                        <CloudSun className="w-10 h-10 text-amber-400/80 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-3xl font-black leading-none text-white/80">
                            {`${weatherTempSec}°`}
                          </span>
                          <span className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1 truncate">
                            {weatherCitySec}
                          </span>
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                            {getWeatherStatus(weatherCodeSec)}
                          </span>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Islamic/Worship Widget */}
              {activePlaylist.showWorship && worshipSchedules.length > 0 && (
                <div className="bg-primary/90 text-white rounded-3xl p-6 border border-primary/20 shadow-2xl flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Waves className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-2 text-accent/80 mb-6">
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Jadwal Shalat</span>
                  </div>
                  <div className="space-y-4 flex-1">
                    {worshipSchedules.map((s, idx) => {
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const [h, m] = s.time.split(':').map(Number);
                      const scheduleMinutes = h * 60 + m;
                      
                      // Find the next upcoming prayer or the current one
                      const hasUpcoming = worshipSchedules.some(prev => {
                        const [ph, pm] = prev.time.split(':').map(Number);
                        return (ph * 60 + pm) > currentMinutes;
                      });

                      let isNext = false;
                      if (!hasUpcoming) {
                        isNext = idx === 0; // Wrap around to first prayer tomorrow
                      } else {
                        isNext = scheduleMinutes > currentMinutes && !worshipSchedules.slice(0, idx).some(prev => {
                          const [ph, pm] = prev.time.split(':').map(Number);
                          return (ph * 60 + pm) > currentMinutes;
                        });
                      }

                      return (
                        <div key={s.id} className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-all",
                          isNext ? "bg-white text-primary scale-105 shadow-xl font-black" : "font-medium text-white/80 border border-white/10"
                        )}>
                          <span className="uppercase tracking-widest text-sm">{s.name}</span>
                          <span className="text-lg">{s.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Event Info */}
              {activePlaylist.showInfoCard && announcementTitle && (
                <div className="bg-white text-primary rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                   <div className="flex items-center gap-2 text-muted-foreground/50 mb-4 text-xs font-black uppercase tracking-widest">
                      <Info className="w-5 h-5 text-accent" />
                      Pengumuman
                   </div>
                   <h3 className="font-black text-xl leading-tight text-primary">{announcementTitle}</h3>
                   {announcementLocation && (
                     <div className="flex items-center gap-2 text-sm font-bold text-primary/60 mt-3 bg-primary/5 p-2 rounded-lg">
                        <MapPin className="w-4 h-4" /> {announcementLocation}
                     </div>
                   )}
                </div>
              )}

              {/* QR Code Sync */}
              {activePlaylist.showQR && qrUrl && (
                <div className="bg-accent/10 backdrop-blur-md rounded-3xl p-6 border border-accent/20 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black uppercase text-accent tracking-tighter">Scan for Details</h4>
                    <p className="text-[10px] text-white/70 leading-tight mt-1 font-medium truncate">{qrUrl.replace(/^https?:\/\//, '')}</p>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Global Ticker */}
        {activePlaylist.showTicker && tickerMessage && (
          <div className="h-16 shrink-0 bg-primary/80 backdrop-blur-md border border-white/20 rounded-2xl flex items-center px-6 overflow-hidden relative shadow-2xl">
            <div className="bg-accent text-primary h-full absolute left-0 flex items-center px-6 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
               <Megaphone className="w-5 h-5 mr-3" />
               <span className="font-black uppercase tracking-widest text-sm">INFO AKTUAL</span>
            </div>
            {/* Ticker Animation */}
            <div className="whitespace-nowrap pl-[200px] animate-[ticker_20s_linear_infinite] z-10">
              <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md flex items-center gap-8">
                {tickerMessage}
                <Sparkles className="w-5 h-5 text-accent" />
                {tickerMessage}
              </span>
            </div>
          </div>
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
