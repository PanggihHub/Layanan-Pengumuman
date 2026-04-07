"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ClockItem {
  city: string;
  timezone: string;
}

const CLOCKS: ClockItem[] = [
  { city: "LOCAL", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { city: "SYD", timezone: "Australia/Sydney" },
  { city: "TOK", timezone: "Asia/Tokyo" },
  { city: "PAR", timezone: "Europe/Paris" },
];

export function ClockWidget() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const newTimes: Record<string, string> = {};
      CLOCKS.forEach((clock) => {
        newTimes[clock.city] = new Date().toLocaleTimeString("en-US", {
          timeZone: clock.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      });
      setTimes(newTimes);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full aspect-square bg-zinc-900 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl border border-white/5">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        {CLOCKS.map((clock) => (
          <div key={clock.city} className="flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/5 p-4">
            <span className="text-[10px] font-black tracking-[0.2em] text-white/40 mb-1">{clock.city}</span>
            <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
              {times[clock.city] || "--:--"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent">Global Sync Active</span>
      </div>
    </div>
  );
}
