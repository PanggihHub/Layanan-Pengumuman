"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ClockItem {
  city: string;
  timezone: string;
  label: string;
}

const CLOCKS: ClockItem[] = [
  { label: "Local", city: "CUPERTINO", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: "Today", city: "TOKYO", timezone: "Asia/Tokyo" },
  { label: "Today", city: "SYDNEY", timezone: "Australia/Sydney" },
  { label: "Today", city: "PARIS", timezone: "Europe/Paris" },
];

export function ClockWidget() {
  const [times, setTimes] = useState<Record<string, { time: string; offset: string; day: string }>>({});

  useEffect(() => {
    const update = () => {
      const newTimes: Record<string, { time: string; offset: string; day: string }> = {};
      
      CLOCKS.forEach((clock) => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: clock.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Get time string
        const timeStr = formatter.format(now);
        
        // Calculate offset (rough estimation for display)
        const localTime = new Date();
        const targetTime = new Date(localTime.toLocaleString("en-US", { timeZone: clock.timezone }));
        const diffHrs = Math.floor((targetTime.getTime() - localTime.getTime()) / (1000 * 60 * 60));
        const offset = diffHrs >= 0 ? `+${diffHrs}:00` : `${diffHrs}:00`;

        newTimes[clock.city] = {
          time: timeStr,
          offset: offset,
          day: targetTime.getDate() === localTime.getDate() ? "Today" : targetTime.getDate() < localTime.getDate() ? "Yesterday" : "Tomorrow",
        };
      });
      setTimes(newTimes);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full aspect-square bg-zinc-900 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl border border-white/5">
      <div className="flex flex-col h-full justify-center">
        <div className="grid grid-cols-4 gap-2">
          {CLOCKS.map((clock) => (
            <div key={clock.city} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 relative shadow-inner border border-black/10">
                <div className="w-0.5 h-4 bg-black rounded-full absolute top-2 origin-bottom transform rotate-[45deg]" />
                <div className="w-0.5 h-3 bg-black/60 rounded-full absolute top-3 origin-bottom transform rotate-[190deg]" />
                <div className="w-1 h-1 bg-orange-500 rounded-full z-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-[6px] font-bold text-black/20 mt-6">12</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-white tracking-tight">{clock.city}</span>
              <span className="text-[8px] font-bold text-white/40 uppercase mt-0.5">{times[clock.city]?.day || "Today"}</span>
              <span className="text-[8px] font-mono text-white/20 mt-0.5">{times[clock.city]?.offset || "+0:00"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent">Precision Clock Engine</span>
      </div>
    </div>
  );
}
