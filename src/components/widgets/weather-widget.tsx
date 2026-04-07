"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayForecast {
  day: string;
  tempHigh: number;
  tempLow: number;
  code: number;
}

const getWeatherIcon = (code: number, className?: string) => {
  if (code === 0) return <Sun className={cn("text-yellow-400", className)} />;
  if (code < 4) return <Cloud className={cn("text-blue-200", className)} />;
  if (code < 70) return <CloudRain className={cn("text-blue-400", className)} />;
  if (code < 80) return <CloudSnow className={cn("text-zinc-100", className)} />;
  if (code < 100) return <CloudLightning className={cn("text-purple-400", className)} />;
  return <Wind className={cn("text-zinc-400", className)} />;
};

export function WeatherWidget() {
  const [data, setData] = useState<{ current: number; high: number; low: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-7.78&longitude=110.38&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
        );
        const json = await res.json();
        setData({
          current: Math.round(json.current_weather.temperature),
          high: Math.round(json.daily.temperature_2m_max[0]),
          low: Math.round(json.daily.temperature_2m_min[0]),
          code: json.current_weather.weathercode,
        });
      } catch (e) {
        console.error("Weather fetch error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return (
    <div className="w-full aspect-square bg-zinc-950 rounded-3xl p-4 grid grid-cols-2 gap-4 shadow-2xl border border-white/5 overflow-hidden">
      <div className="bg-sky-500 rounded-3xl p-5 flex flex-col justify-between text-white relative group overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Yogyakarta</p>
          <p className="text-4xl font-bold tracking-tighter mt-1">{data?.current || "--"}°</p>
        </div>
        <div className="relative z-10">
          {getWeatherIcon(data?.code || 0, "w-6 h-6 mb-1")}
          <p className="text-[9px] font-bold uppercase tracking-tight opacity-80">Partly Cloudy</p>
          <div className="flex gap-2 text-[10px] font-bold mt-0.5">
            <span>H:{data?.high || "--"}°</span>
            <span className="opacity-40">L:{data?.low || "--"}°</span>
          </div>
        </div>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="bg-zinc-900 rounded-3xl p-5 flex flex-col justify-between text-white border border-white/5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none">New York</p>
          <p className="text-4xl font-bold tracking-tighter mt-1">1°</p>
        </div>
        <div>
           <Cloud className="w-6 h-6 mb-1 text-zinc-500" />
           <p className="text-[9px] font-bold uppercase tracking-tight opacity-40">Cloudy</p>
           <div className="flex gap-2 text-[10px] font-bold mt-0.5 opacity-40">
            <span>H:1°</span>
            <span>L:-2°</span>
          </div>
        </div>
      </div>
    </div>
  );
}