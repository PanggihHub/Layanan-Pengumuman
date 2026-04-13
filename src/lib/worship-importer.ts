/**
 * worship-importer.ts
 * Fetches Islamic prayer times from the Aladhan API and converts them
 * into WorshipSchedule entries for Firestore.
 *
 * API: https://aladhan.com/prayer-times-api
 * No API key required. Free, open-access.
 *
 * Generated schedules are tagged source="auto" and are idempotent —
 * re-importing the same day replaces previous auto-imported entries.
 */

import { WorshipSchedule } from "./mock-data";

export interface PrayerImportOptions {
  /** City name for geocoding, e.g. "Jakarta" */
  city: string;
  /** ISO 3166-1 country code, e.g. "ID" */
  country: string;
  /** Calculation method (Aladhan ID). Default 11 = Egyptian GA */
  method?: number;
  /** Room/Hall shown on display as the location field */
  locationLabel?: string;
}

export const ALADHAN_METHODS: { id: number; label: string }[] = [
  { id: 1,  label: "University of Islamic Sciences, Karachi" },
  { id: 2,  label: "Islamic Society of North America (ISNA)" },
  { id: 3,  label: "Muslim World League (MWL)" },
  { id: 4,  label: "Umm al-Qura, Makkah" },
  { id: 5,  label: "Egyptian General Authority of Survey" },
  { id: 11, label: "Majlis Ugama Islam Singapura (MUIS)" },
  { id: 13, label: "Kementerian Agama RI (Indonesia)" },
  { id: 15, label: "Diyanet İşleri Başkanlığı (Turkey)" },
  { id: 16, label: "Spiritual Administration of Muslims of Russia" },
];

/** Five daily Islamic prayer names (English + Indonesian) */
const PRAYER_NAMES: Record<string, { en: string; id: string; order: number }> = {
  Fajr:    { en: "Fajr (Subuh)",   id: "Subuh",   order: 1 },
  Dhuhr:   { en: "Dhuhr (Dzuhur)", id: "Dzuhur",  order: 2 },
  Asr:     { en: "Asr (Ashar)",    id: "Ashar",   order: 3 },
  Maghrib: { en: "Maghrib",        id: "Maghrib", order: 4 },
  Isha:    { en: "Isha (Isya)",    id: "Isya",    order: 5 },
};

interface AladhanTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise?: string;
  [key: string]: string | undefined;
}

interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanTimings;
    date: { readable: string; timestamp: string };
    meta: { timezone: string; method: { id: number; name: string } };
  };
}

/**
 * Fetch today's Islamic prayer times for a city from Aladhan.
 * Returns an array of WorshipSchedule ready to upsert into Firestore.
 */
export async function fetchIslamicPrayerTimes(
  opts: PrayerImportOptions,
): Promise<WorshipSchedule[]> {
  const { city, country, method = 13, locationLabel } = opts;

  const today = new Date();
  const dd    = String(today.getDate()).padStart(2, "0");
  const mm    = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy  = today.getFullYear();

  const url = `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;

  const resp: AladhanResponse = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`Aladhan HTTP ${r.status}`);
    return r.json();
  });

  if (resp.code !== 200) throw new Error(resp.status);

  const timings = resp.data.timings;
  const importedAt = new Date().toISOString();

  return Object.entries(PRAYER_NAMES).map(([key, meta]) => {
    // Aladhan returns "HH:mm (TZ)" — strip timezone suffix
    const rawTime = (timings[key as keyof AladhanTimings] ?? "00:00").split(" ")[0];
    return {
      id:          `auto-${key.toLowerCase()}`,
      name:        meta.id,   // localized Indonesian prayer name
      time:        rawTime,
      location:    locationLabel ?? "Masjid / Prayer Hall",
      frequency:   "Daily",
      active:      true,
      category:    "islamic",
      source:      "auto",
      importedAt,
    } satisfies WorshipSchedule;
  });
}

/**
 * Sort worship schedules so the next upcoming prayer appears first.
 * Wraps around midnight (so after Isha, Fajr of next day comes first).
 */
export function sortSchedulesByNextPrayer(
  schedules: WorshipSchedule[],
  nowMinutes?: number,   // total minutes since midnight (defaults to current device time)
): WorshipSchedule[] {
  const now = nowMinutes ?? (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const active = schedules.filter(s => s.active);
  const inactive = schedules.filter(s => !s.active);

  // Upcoming first, then wrap-around past schedules
  const upcoming = active
    .filter(s => toMinutes(s.time) >= now)
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  const past = active
    .filter(s => toMinutes(s.time) < now)
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  return [...upcoming, ...past, ...inactive];
}

/**
 * Returns "X min" or "in Xh Ym" until the next upcoming prayer.
 */
export function getTimeUntil(hhmm: string, nowMs = Date.now()): string {
  const now      = new Date(nowMs);
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const [h, m]   = hhmm.split(":").map(Number);
  let target     = h * 60 + m;
  if (target <= nowMins) target += 1440;   // wrap to next day
  const diff     = target - nowMins;
  if (diff < 1)    return "Now";
  if (diff < 60)   return `${diff} min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}
