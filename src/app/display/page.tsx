"use client";

import { useEffect, useState, useMemo } from "react";
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
  Waves
} from "lucide-react";
import { cn } from "@/lib/utils";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { Playlist, MediaItem } from "@/lib/mock-data";

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export default function DisplayClient() {
  const [tickerMessage, setTickerMessage] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
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
      }
    });

    return () => {
      unsubPlaylists();
      unsubMedia();
      unsubSettings();
    };
  }, []);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const loopItems = useMemo(() => {
    if (!activePlaylist) return [];
    return activePlaylist.items
      .map(id => mediaItems.find(m => m.id === id))
      .filter((m): m is MediaItem => !!m);
  }, [activePlaylist, mediaItems]);

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

  if (!activePlaylist || loopItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
        <Sparkles className="w-16 h-16 text-accent mb-6 animate-pulse" />
        <h1 className="text-4xl font-black uppercase tracking-widest text-primary">Standby Mode</h1>
        <p className="text-muted-foreground mt-4 text-xl">Awaiting playlist configuration from network...</p>
        <div className="absolute bottom-8 left-8 text-xs font-mono opacity-30">
          NODE: OFFLINE | WAITING FOR HANDSHAKE
        </div>
      </div>
    );
  }

  const currentMedia = loopItems[currentIndex];
  const layout = activePlaylist.layout || 'single';

  // Extract location name gracefully (e.g. Asia/Makassar => Makassar)
  const locationName = timezone.split('/')[1]?.replace('_', ' ') || 'Jakarta';

  const renderMediaContent = (mediaCls: string) => {
    if (!currentMedia) return null;
    const youtubeId = currentMedia.source === "external" ? extractYouTubeId(currentMedia.url) : null;
    
    if (currentMedia.type === "video" || youtubeId) {
      if (youtubeId) {
        return (
          <iframe 
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}`} 
            className={cn("w-full h-full object-cover pointer-events-none", mediaCls)} 
            frameBorder="0" 
            allow="autoplay; fullscreen" 
          />
        );
      } else {
        // Render raw video
        return (
          <video 
            src={currentMedia.url} 
            className={cn("w-full h-full object-cover", mediaCls)} 
            autoPlay 
            muted 
            loop 
          />
        );
      }
    } else {
      return (
        <Image 
          src={currentMedia.url} 
          alt={currentMedia.name} 
          fill 
          className={cn("object-cover", mediaCls)}
          unoptimized 
        />
      );
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-sans text-white">
      
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

            {/* SPLITS / GRID LAYOUTS (Mocked secondary units for demo) */}
            {layout !== 'single' && (
              <>
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/50">
                  {renderMediaContent("")}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6">
                    <h3 className="text-3xl font-black leading-tight drop-shadow-xl">{currentMedia?.name}</h3>
                  </div>
                </div>
                {layout.includes('split') && (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 p-6 flex flex-col justify-center">
                    <Badge className="w-fit bg-primary text-white border-none mb-4">Network Feed</Badge>
                    <h3 className="text-4xl font-black">Secondary Information Stream Active</h3>
                    <p className="text-white/60 mt-2 text-xl">Lorem ipsum dolor sit amet constrectur adipscing.</p>
                  </div>
                )}
                {layout === 'grid-2x2' && [1, 2, 3].map(i => (
                  <div key={i} className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center p-8">
                     <p className="text-white/30 font-black uppercase tracking-widest text-center">Auxiliary Content {i}<br/>Network Provisioned</p>
                  </div>
                ))}
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
                  {currentTime.toLocaleTimeString('id-ID', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                 </h2>
                 <p className="text-accent text-lg font-bold tracking-widest uppercase mt-2">
                  {currentTime.toLocaleDateString('id-ID', { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric' })}
                 </p>
                 <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/10 w-full justify-center">
                    <div className="flex items-center gap-3">
                      <CloudSun className="w-10 h-10 text-yellow-400" />
                      <div className="flex flex-col">
                        <span className="text-3xl font-black leading-none text-white">28°</span>
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">{locationName}</span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Islamic/Worship Widget */}
              {activePlaylist.showWorship && (
                <div className="bg-primary/90 text-white rounded-3xl p-6 border border-primary/20 shadow-2xl flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Waves className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-2 text-accent/80 mb-6">
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Jadwal Shalat</span>
                  </div>
                  <div className="space-y-4 flex-1">
                    {[
                      { name: "Subuh", time: "04:30" },
                      { name: "Dzuhur", time: "11:55", active: true },
                      { name: "Ashar", time: "15:15" },
                      { name: "Maghrib", time: "17:50" },
                      { name: "Isya", time: "19:05" }
                    ].map(s => (
                      <div key={s.name} className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all",
                        s.active ? "bg-white text-primary scale-105 shadow-xl font-black" : "font-medium text-white/80 border border-white/10"
                      )}>
                        <span className="uppercase tracking-widest text-sm">{s.name}</span>
                        <span className="text-lg">{s.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Event Info */}
              {activePlaylist.showInfoCard && (
                <div className="bg-white text-primary rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                   <div className="flex items-center gap-2 text-muted-foreground/50 mb-4 text-xs font-black uppercase tracking-widest">
                      <Info className="w-5 h-5 text-accent" />
                      Pengumuman
                   </div>
                   <h3 className="font-black text-xl leading-tight text-primary">Briefing Mingguan Staf & Pengajar</h3>
                   <div className="flex items-center gap-2 text-sm font-bold text-primary/60 mt-3 bg-primary/5 p-2 rounded-lg">
                      <MapPin className="w-4 h-4" /> Ruang Rapat Utama
                   </div>
                </div>
              )}

              {/* QR Code Sync */}
              {activePlaylist.showQR && (
                <div className="bg-accent/10 backdrop-blur-md rounded-3xl p-6 border border-accent/20 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-accent tracking-tighter">Scan for Details</h4>
                    <p className="text-[10px] text-white/70 leading-tight mt-1 font-medium">Get the document attachments for today's sessions instantly.</p>
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
    </div>
  );
}
