
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cloud, Clock, MapPin, Info, TriangleAlert } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

// Mock Playlist Content
const playlist = [
  { id: 1, type: "image", src: "https://picsum.photos/seed/screensense1/1920/1080", duration: 8000, title: "Welcome to Campus" },
  { id: 2, type: "image", src: "https://picsum.photos/seed/science/1920/1080", duration: 8000, title: "Science Fact: Photosynthesis" },
  { id: 3, type: "image", src: "https://picsum.photos/seed/campus/1920/1080", duration: 8000, title: "Upcoming Events" },
];

export default function DisplayClient() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    // Time update loop
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Playlist loop
    const rotate = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, playlist[currentIndex].duration);

    return () => {
      clearInterval(timer);
      clearInterval(rotate);
    };
  }, [currentIndex]);

  const currentItem = playlist[currentIndex];

  return (
    <div className="signage-full bg-black">
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {playlist.map((item, idx) => (
          <div
            key={item.id}
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
            />
            {/* Overlay Info Card */}
            <div className="absolute bottom-24 left-12 p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white max-w-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <Info className="text-accent w-6 h-6" />
                <span className="text-accent font-bold tracking-widest uppercase text-sm">Feature Story</span>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight">
                {item.title}
              </h2>
            </div>
          </div>
        ))}

        {/* Dynamic Modules Overlay */}
        <div className="absolute top-12 right-12 z-20 flex flex-col items-end gap-6">
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-white flex flex-col items-end min-w-[280px] shadow-2xl">
            <div className="flex items-center gap-2 text-accent mb-1 font-bold">
              <MapPin className="w-4 h-4" />
              <span>Main Campus Hall</span>
            </div>
            <div className="text-7xl font-bold tracking-tighter">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-lg opacity-80 font-medium">
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="text-blue-300 w-8 h-8" />
                <div>
                  <div className="text-2xl font-bold">28°C</div>
                  <div className="text-xs uppercase tracking-widest opacity-60 font-bold">Partly Cloudy</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-60 font-bold uppercase">AQI Index</div>
                <div className="text-green-400 font-bold">42 (Good)</div>
              </div>
            </div>
          </div>
          
          {/* Interactive QR Code Widget */}
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center border-2 border-primary/20">
               <span className="text-[8px] font-bold text-primary text-center leading-none">SCAN TO LEARN MORE</span>
            </div>
            <div className="text-primary pr-2">
              <p className="font-bold text-sm">Mobile Companion</p>
              <p className="text-xs text-muted-foreground">Scan for full article</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast System Mock (Triggerable via state) */}
      {showEmergency && (
        <div className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center p-12 text-white animate-pulse">
          <TriangleAlert className="w-48 h-48 mb-8" />
          <h1 className="text-8xl font-black uppercase mb-4 tracking-tighter">Emergency Alert</h1>
          <p className="text-4xl text-center font-bold">SHELTER IN PLACE IMMEDIATELY. AWAIT FURTHER INSTRUCTIONS.</p>
        </div>
      )}

      {/* Ticker System */}
      <div className="ticker-wrap border-t border-white/20 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <div className="ticker-content flex gap-24 items-center">
          <span className="font-bold">CAMPUS NEWS:</span>
          <span>Faculty meeting at 4 PM in Conference Room B</span>
          <span className="text-accent">•</span>
          <span>New cafeteria menu launched today - Try the Indonesian Rendang!</span>
          <span className="text-accent">•</span>
          <span>Registration for Spring Semester opens next Monday</span>
          <span className="text-accent">•</span>
          <span>Library hours extended during examination week (Open 24/7)</span>
          <span className="text-accent">•</span>
          <span>AI Research Lab wins Global Innovation Award</span>
        </div>
      </div>
    </div>
  );
}
