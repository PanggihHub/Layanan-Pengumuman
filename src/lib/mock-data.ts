/**
 * @fileOverview Centralized mock data store for ScreenSense.
 * This simulates a database for media, playlists, and screen settings.
 */

export type MediaType = 'image' | 'video' | 'document' | 'website' | 'clock' | 'weather' | 'external_video';
/**
 * Video pipeline class:
 * - 'motion_video'  → ≤1080p FHD; direct play, no transcoding needed
 * - 'hd_stream'     → >1080p (4K/8K); real-time adaptive HLS/DASH transcode pipeline
 * - 'adaptive'      → system-auto detected per device capacity
 */
export type VideoClass = 'motion_video' | 'hd_stream' | 'adaptive';
export type MediaSourceOrigin = 'internal' | 'external';
export type DisplayLayout = 'single' | 'grid-2x2' | 'split-v' | 'split-h' | 'widget-hub';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface DaySchedule {
  active: boolean;
  windows: TimeWindow[];
}

export interface PlaylistSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface MediaItem {
  id: string;
  name: string;
  title?: string | null;
  content?: string | null;
  type: MediaType;
  source: MediaSourceOrigin;
  size: string;
  date: string;
  validFrom?: string | null;
  validUntil?: string | null;
  priority?: number | null;
  url: string;
  category: 'campus' | 'science' | 'math' | 'events';
  description?: string | null;
  // Metadata for video clipping/transform
  startTime?: number | null; 
  endTime?: number | null;
  quality?: string | null;
  isActive?: boolean | null;
  // Adaptive Streaming Pipeline
  videoClass?: VideoClass | null;       // 'motion_video' | 'hd_stream' | 'adaptive'
  resolutionWidth?: number | null;      // detected or declared pixel width
  resolutionHeight?: number | null;     // detected or declared pixel height
  bitrateKbps?: number | null;          // detected or target bitrate (kbps)
  lazyLoad?: boolean | null;            // enable lazy/deferred loading for this asset
  dynamicBuffer?: boolean | null;       // enable dynamic buffer sizing based on device
  codecHint?: string | null;            // e.g. 'h264' | 'h265' | 'vp9' | 'av1'
}

export interface ScreenStatus {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'DEACTIVATED';
  playlistId: string;
  uptime: string;
  lastSeen: string | null;
  location?: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: string[];
  isSystem?: boolean | null;
  schedule?: string | null;
  structuredSchedule?: PlaylistSchedule | null;
  // Visibility overrides per playlist (Scene settings)
  showTicker?: boolean | null;
  showInfoCard?: boolean | null;
  showWorship?: boolean | null;
  showQR?: boolean | null;
  layout?: DisplayLayout | null;
}

export interface WorshipSchedule {
  id: string;
  name: string;         // e.g. "Subuh", "Jumaat Prayer"
  time: string;         // HH:mm — always in local timezone
  location: string;     // room / building name
  frequency: string;    // "Daily", "Weekly (Fri)", etc.
  active: boolean;
  category?: 'islamic' | 'christian' | 'general' | 'custom' | null;
  source?: 'auto' | 'manual' | null;  // auto = imported from Aladhan API
  importedAt?: string | null;         // ISO timestamp of last auto-import
}

/** Priority-based ticker queue entry */
export interface TickerMessage {
  id: string;
  message: string;
  priority: 'urgent' | 'normal' | 'info';
  active: boolean;
  createdAt: string;        // ISO string
  expiresAt?: string | null;       // ISO – message auto-expires after this
  durationMs?: number;      // how long this message shows per cycle (ms)
  order?: number;            // manual sort order within same priority
}

export interface SecurityAuditLog {
  id: string;
  event: string;
  timestamp: string;
  user: string;
  status: 'Success' | 'Failed' | 'Blocked' | 'Warning' | 'Verified';
  category: 'auth' | 'config' | 'access' | 'lockout' | 'system';
  details?: string;
  ip?: string;
}

export const INITIAL_MEDIA: MediaItem[] = [
  { 
    id: '1', 
    name: 'Orientation_Hero.jpg', 
    type: 'image', 
    source: 'internal',
    size: '2.4 MB', 
    date: '2023-10-12', 
    url: 'https://picsum.photos/seed/screensense1/1920/1080', 
    category: 'campus',
    description: 'Main hero image for campus orientation week.'
  },
  { 
    id: '2', 
    name: 'Science_Fact_Photosynthesis.mp4', 
    type: 'video', 
    source: 'internal',
    size: '45.1 MB', 
    date: '2023-10-14', 
    url: 'https://picsum.photos/seed/science/1920/1080', 
    category: 'science',
    description: 'Animated video explaining the photosynthesis process.',
    startTime: 0,
    endTime: 30
  },
  { 
    id: '3', 
    name: 'Campus_Map_Vertical.png', 
    type: 'image', 
    source: 'internal',
    size: '1.8 MB', 
    date: '2023-10-15', 
    url: 'https://picsum.photos/seed/campus/1920/1080', 
    category: 'campus',
    description: 'Detailed vertical map of the north quadrant.'
  },
  { 
    id: '4', 
    name: 'Welcome_Slide_V2.jpg', 
    type: 'image', 
    source: 'internal',
    size: '3.2 MB', 
    date: '2023-10-16', 
    url: 'https://picsum.photos/seed/display/1920/1080', 
    category: 'events',
    description: 'Generic welcome slide for guest lectures.'
  },
  { 
    id: '5', 
    name: 'Prime_Numbers_Grid.png', 
    type: 'image', 
    source: 'internal',
    size: '1.2 MB', 
    date: '2023-10-18', 
    url: 'https://picsum.photos/seed/math/1920/1080', 
    category: 'math',
    description: 'Visual representation of prime numbers 1-100.'
  },
  { 
    id: '6', 
    name: 'Cafeteria_Menu.pdf', 
    type: 'document', 
    source: 'internal',
    size: '0.5 MB', 
    date: '2023-10-20', 
    url: 'https://picsum.photos/seed/food/1920/1080', 
    category: 'events',
    description: 'Daily lunch menu for the central cafeteria.'
  },
  {
    id: 'w-clock',
    name: 'Digital Clock Widget',
    type: 'clock',
    source: 'internal',
    size: '0.1 MB',
    date: '2026-04-08',
    url: 'widget://clock',
    category: 'campus',
    description: 'System-wide digital clock with date overlay.'
  },
  {
    id: 'w-weather',
    name: 'Smart Weather Widget',
    type: 'weather',
    source: 'internal',
    size: '0.2 MB',
    date: '2026-04-08',
    url: 'widget://weather',
    category: 'science',
    description: 'Real-time weather forecast and temperature display.'
  },
];

export const SCREEN_STATUS: ScreenStatus[] = [
  { id: "S-101", name: "Main Hall A", status: "Online", playlistId: "default-1", uptime: "14d 2h", lastSeen: "Just now" },
  { id: "S-102", name: "Library Entrance", status: "Online", playlistId: "default-2", uptime: "5d 6h", lastSeen: "2m ago" },
  { id: "S-103", name: "Cafeteria East", status: "Offline", playlistId: "system-default", uptime: "0", lastSeen: "4h ago" },
  { id: "S-104", name: "Admin Block", status: "Online", playlistId: "default-1", uptime: "22d 1h", lastSeen: "Just now" },
];

export const SCREEN_SETTINGS = {
  tickerMessage: "FACULTY MEETING: Conference Room B at 4 PM • New cafeteria menu launched today! • Registration for Spring Semester opens next Monday.",
  emergencyAlert: false,
  locationName: "Main Campus Hall",
  activePlaylistId: "default-1",
  displayLayout: 'single' as DisplayLayout,
  // Global defaults if not set in playlist
  showTicker: true,
  showInfoCard: true,
  showWorship: true,
  showQR: true,
  // Weather Settings
  weatherLat: -7.78,
  weatherLng: 110.38,
  weatherCity: "Yogyakarta",
  weatherLatSecondary: 40.71,
  weatherLngSecondary: -74.00,
  weatherCitySecondary: "New York",
  isPanicLocked: false,
};

export const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  { id: '1', event: "PIN Rotation", timestamp: "2026-04-08T10:00:00Z", user: "Admin", status: "Success", category: "config" },
  { id: '2', event: "MFA Challenge", timestamp: "2026-04-08T08:00:00Z", user: "Staff-12", status: "Success", category: "auth" },
  { id: '3', event: "Login Failure", timestamp: "2026-04-08T05:00:00Z", user: "Unknown", status: "Blocked", category: "auth" },
];

export const PLAYLISTS: Playlist[] = [
  {
    id: "system-default",
    name: "System: Info Hub",
    description: "Built-in dynamic card containing Clock, Weather, and AQI modules. Managed by system settings.",
    items: ['1', '3'],
    isSystem: true,
    schedule: "Always Active (24/7)",
    showTicker: true,
    showInfoCard: true,
    showWorship: true,
    showQR: true,
    layout: 'single',
  },
  {
    id: "default-1",
    name: "Standard Campus Loop",
    description: "Main rotation for general announcements and science facts across the campus network.",
    items: ['1', '2', '3', '5', '4', '1'],
    schedule: "Mon-Fri, 08:00 - 18:00",
    showTicker: true,
    showInfoCard: true,
    showWorship: true,
    showQR: true,
    layout: 'single',
  },
  {
    id: "default-2",
    name: "Quiet Study",
    description: "Calm visuals and library-specific information for designated study zones and digital quiet areas.",
    items: ['3', '5'],
    schedule: "Mon-Sat, 09:00 - 21:00",
    showTicker: false,
    showInfoCard: true,
    showWorship: false,
    showQR: true,
    layout: 'single',
  },
  {
    id: "widget-scene",
    name: "Information Hub (Widgets)",
    description: "Real-time Clock, Weather, and Market data hub designed for high-traffic entry points.",
    items: ['4', '1'],
    schedule: "Daily, 07:00 - 22:00",
    showTicker: true,
    showInfoCard: true,
    showWorship: true,
    showQR: true,
    layout: 'widget-hub',
  },
  {
    id: "default-info-hub",
    name: "Default Info Hub (Clock & Weather)",
    description: "Initial system playlist containing Clock and Weather widgets. Automatically active if no other content is set.",
    items: ['w-clock', 'w-weather'],
    isSystem: true,
    schedule: "Always Active",
    showTicker: true,
    showInfoCard: true,
    showWorship: true,
    showQR: true,
    layout: 'split-h',
  }
];

export const WORSHIP_SCHEDULES: WorshipSchedule[] = [
  { id: 'w1', name: 'Morning Prayer', time: '07:30', location: 'Campus Chapel', frequency: 'Daily', active: true },
  { id: 'w2', name: 'Midday Meditation', time: '12:15', location: 'Garden Room', frequency: 'Mon-Fri', active: true },
  { id: 'w3', name: 'Evening Vespers', time: '18:00', location: 'Main Sanctuary', frequency: 'Weekly (Sun)', active: true },
];
