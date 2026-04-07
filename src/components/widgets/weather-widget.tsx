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

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
  if (code < 4) return <Cloud className="w-5 h-5 text-blue-200" />;
  if (code < 70) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code < 80) return <CloudSnow className="w-5 h-5 text-zinc-100" />;
  if (code < 100) return <CloudLightning className="w-5 h-5 text-purple-400" />;
  return <Wind className="w-5 h-5 text-zinc-400" />;
};

export function WeatherWidget() {
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Yogyakarta Coordinates
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-7.78&longitude=110.38&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto"
        );
        const data = await res.json();
        
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const formatted: DayForecast[] = data.daily.time.slice(0, 5).map((time: string, i: number) => {
          const date = new Date(time);
          return {
            day: days[date.getDay()],
            tempHigh: Math.round(data.daily.temperature_2m_max[i]),
            tempLow: Math.round(data.daily.temperature_2m_min[i]),
            code: data.daily.weather_code[i],
          };
        });
        setForecast(formatted);
      } catch (e) {
        console.error("Weather fetch error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return (
    <div className="w-full aspect-square bg-sky-600 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl border border-white/10 text-white">
      <div className="flex flex-col gap-3 h-full justify-center">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-white/20 rounded w-full" />
            ))}
          </div>
        ) : (
          forecast.map((day, i) => (
            <div key={i} className="flex items-center justify-between group">
              <span className="text-xs font-black tracking-widest w-10 opacity-70">{day.day}</span>
              <div className="flex-1 flex justify-center">
                {getWeatherIcon(day.code)}
              </div>
              <div className="flex gap-3 w-16 justify-end font-bold text-sm">
                <span>{day.tempHigh}°</span>
                <span className="opacity-40">{day.tempLow}°</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 text-center">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Yogyakarta Forecast</span>
      </div>
    </div>
  );
}
