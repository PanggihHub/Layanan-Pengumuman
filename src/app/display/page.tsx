
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Cloud, 
  MapPin, 
  Info, 
  TriangleAlert, 
  Heart, 
  Clock, 
  ChevronRight, 
  Home, 
  LayoutDashboard, 
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INITIAL_MEDIA, PLAYLISTS, SCREEN_SETTINGS, WORSHIP_SCHEDULES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DisplayClient() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState<Date | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(false);

  const activePlaylist = useMemo(() => {
    const playlistDef = PLAYLISTS.find(p => p.id === SCREEN_SETTINGS.activePlaylistId);
    if (!playlistDef) return [];
    
    return playlistDef.items.map(itemId => {
      const media = INITIAL_MEDIA.find(m => m.id === itemId);
      return {
        id: itemId,
        src: media?.url || 'https://picsum.photos/seed/placeholder/1920/1080',
        title: media?.name.replace(/_/g, ' ').replace(/\.[^/.]+$/, "") || 'Campus News',
        duration: 8000
      };
    });
  }, []);

  const activeSchedules = useMemo(() => {
    return WORSHIP_SCHEDULES.filter(s => s.active);
  }, []);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    if (activePlaylist.length === 0) return () => clearInterval(timer);

    const rotate = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePlaylist.length);
    }, activePlaylist[currentIndex]?.duration || 8000);

    return () => {
      clearInterval(timer);
      clearInterval(rotate);
    };
  }, [currentIndex, activePlaylist]);

  if (activePlaylist.length === 0) {
    return (
      <div className="signage-full bg-black flex items-center justify-center text-white">
        <p className="text-2xl animate-pulse font-bold tracking-widest uppercase">Initializing Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="signage-full bg-black group" onMouseMove={() => setIsNavVisible(true)}>
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activePlaylist.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              priority
              className="object-cover"
              unoptimized
            />
            {/* Overlay Info Card */}
            <div className="absolute bottom-24 left-12 p-8 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 text-white max-w-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <Info className="text-accent w-6 h-6" />
                <span className="text-accent font-bold tracking-widest uppercase text-xs">Broadcast Feature</span>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight drop-shadow-lg">
                {item.title}
              </h2>
            </div>
          </div>
        ))}

        {/* Floating Navigator (Visible on mouse move) */}
        <div className={cn(
          "absolute top-6 left-6 z-[60] transition-all duration-500",
          isNavVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
        )}>
          <DropdownMenu onOpenChange={(open) => !open && setTimeout(() => setIsNavVisible(false), 2000)}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/80">
                <X className="w-6 h-6 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-48 bg-black/90 text-white border-white/10 backdrop-blur-xl">
              <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer">
                <Link href="/">
                  <Home className="w-4 h-4 text-accent" />
                  <span>Return Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer">
                <Link href="/admin">
                  <LayoutDashboard className="w-4 h-4 text-accent" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dynamic Modules Overlay */}
        <div className="absolute top-12 right-12 z-20 flex flex-col items-end gap-6">
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl text-white flex flex-col items-end min-w-[280px] shadow-2xl">
            <div className="flex items-center gap-2 text-accent mb-1 font-bold">
              <MapPin className="w-4 h-4" />
              <span>{SCREEN_SETTINGS.locationName}</span>
            </div>
            <div className="text-7xl font-bold tracking-tighter">
              {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </div>
            <div className="text-lg opacity-80 font-medium">
              {time ? time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : "Loading..."}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="text-blue-300 w-8 h-8" />
                <div>
                  <div className="text-2xl font-bold">28°C</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Partly Cloudy</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] opacity-60 font-bold uppercase">AQI Index</div>
                <div className="text-green-400 font-bold">42 (Good)</div>
              </div>
            </div>
          </div>
          
          {/* Worship Schedule Widget */}
          {activeSchedules.length > 0 && (
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl text-white min-w-[280px] shadow-2xl animate-in fade-in slide-in-from-right-4 duration-1000">
              <div className="flex items-center gap-2 text-accent mb-4 border-b border-white/10 pb-2">
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Worship Rotation</span>
              </div>
              <div className="space-y-4">
                {activeSchedules.slice(0, 2).map((schedule) => (
                  <div key={schedule.id} className="group">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-white/90 group-hover:text-accent transition-colors">{schedule.name}</p>
                      <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded-full">{schedule.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/60 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{schedule.frequency}</span>
                      <span className="mx-1">•</span>
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{schedule.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive QR Code Widget */}
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white">
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center border-2 border-primary/20 relative">
               <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                  <span className="text-[6px] font-black text-primary text-center leading-none uppercase">Scan for<br/>Details</span>
               </div>
            </div>
            <div className="text-primary pr-2">
              <p className="font-bold text-sm tracking-tight">Interactive Hub</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Campus Companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker System */}
      <div className="ticker-wrap border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] bg-primary/90 backdrop-blur-md">
        <div className="ticker-content flex gap-24 items-center">
          <span className="font-black bg-white text-primary px-3 py-1 rounded text-xs">LIVE STREAM</span>
          <span className="text-lg font-medium">{SCREEN_SETTINGS.tickerMessage}</span>
          <span className="text-accent text-2xl">•</span>
          <span className="text-lg font-medium">ScreenSense: Powering Intelligence Across Campus</span>
        </div>
      </div>
    </div>
  );
}
