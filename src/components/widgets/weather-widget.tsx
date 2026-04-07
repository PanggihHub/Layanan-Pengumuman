"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCREEN_SETTINGS } from "@/lib/mock-data";

interface WeatherData {
  current: number;
  high: number;
  low: number;
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
  const [primary, setPrimary] = useState<WeatherData | null>(null);
  const [secondary, setSecondary] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Fetch Primary
        const resPrimary = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${SCREEN_SETTINGS.weatherLat}&longitude=${SCREEN_SETTINGS.weatherLng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const jsonPrimary = await resPrimary.json();
        setPrimary({
          current: Math.round(jsonPrimary.current_weather.temperature),
          high: Math.round(jsonPrimary.daily.temperature_2m_max[0]),
          low: Math.round(jsonPrimary.daily.temperature_2m_min[0]),
          code: jsonPrimary.current_weather.weathercode,
        });

        // Fetch Secondary
        const resSecondary = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${SCREEN_SETTINGS.weatherLatSecondary}&longitude=${SCREEN_SETTINGS.weatherLngSecondary}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const jsonSecondary = await resSecondary.json();
        setSecondary({
          current: Math.round(jsonSecondary.current_weather.temperature),
          high: Math.round(jsonSecondary.daily.temperature_2m_max[0]),
          low: Math.round(jsonSecondary.daily.temperature_2m_min[0]),
          code: jsonSecondary.current_weather.weathercode,
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
      {/* Primary Location Card */}
      <div className="bg-sky-500 rounded-2xl p-5 flex flex-col justify-between text-white relative group overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">
            {SCREEN_SETTINGS.weatherCity || "Primary"}
          </p>
          <p className="text-4xl font-bold tracking-tighter mt-1">{primary?.current ?? "--"}°</p>
        </div>
        <div className="relative z-10">
          {getWeatherIcon(primary?.code ?? 0, "w-6 h-6 mb-1")}
          <p className="text-[9px] font-bold uppercase tracking-tight opacity-80">Local Forecast</p>
          <div className="flex gap-2 text-[10px] font-bold mt-0.5">
            <span>H:{primary?.high ?? "--"}°</span>
            <span className="opacity-40">L:{primary?.low ?? "--"}°</span>
          </div>
        </div>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Secondary Location Card */}
      <div className="bg-zinc-900 rounded-2xl p-5 flex flex-col justify-between text-white border border-white/5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none">
            {SCREEN_SETTINGS.weatherCitySecondary || "Secondary"}
          </p>
          <p className="text-4xl font-bold tracking-tighter mt-1">{secondary?.current ?? "--"}°</p>
        </div>
        <div>
           {getWeatherIcon(secondary?.code ?? 0, "w-6 h-6 mb-1 text-zinc-500")}
           <p className="text-[9px] font-bold uppercase tracking-tight opacity-40">Global Link</p>
           <div className="flex gap-2 text-[10px] font-bold mt-0.5 opacity-40">
            <span>H:{secondary?.high ?? "--"}°</span>
            <span>L:{secondary?.low ?? "--"}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
