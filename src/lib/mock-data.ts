/**
 * @fileOverview Centralized mock data store for ScreenSense.
 * This simulates a database for media, playlists, and screen settings.
 */

export type MediaType = 'image' | 'video' | 'document';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  size: string;
  date: string;
  url: string;
  category: 'campus' | 'science' | 'math' | 'events';
  description?: string;
}

export interface ScreenStatus {
  id: string;
  name: string;
  status: 'Online' | 'Offline';
  playlistId: string;
  uptime: string;
  lastSeen: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: string[];
  isSystem?: boolean;
  schedule?: string;
}

export interface WorshipSchedule {
  id: string;
  name: string;
  time: string;
  location: string;
  frequency: string;
  active: boolean;
}

export const INITIAL_MEDIA: MediaItem[] = [
  { 
    id: '1', 
    name: 'Orientation_Hero.jpg', 
    type: 'image', 
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
    size: '45.1 MB', 
    date: '2023-10-14', 
    url: 'https://picsum.photos/seed/science/1920/1080', 
    category: 'science',
    description: 'Animated video explaining the photosynthesis process.'
  },
  { 
    id: '3', 
    name: 'Campus_Map_Vertical.png', 
    type: 'image', 
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
    size: '0.5 MB', 
    date: '2023-10-20', 
    url: 'https://picsum.photos/seed/food/1920/1080', 
    category: 'events',
    description: 'Daily lunch menu for the central cafeteria.'
  },
];

export const SCREEN_STATUS: ScreenStatus[] = [
  { id: "S-101", name: "Main Hall A", status: "Online", playlistId: "default-1", uptime: "14d 2h", lastSeen: "Just now" },
  { id: "S-102", name: "Library Entrance", status: "Online", playlistId: "default-2", uptime: "5d 6h", lastSeen: "2m ago" },
  { id: "S-103", name: "Cafeteria East", status: "Offline", playlistId: "system-default", uptime: "0", lastSeen: "4h ago" },
  { id: "S-104", name: "Admin Block", status: "Online", playlistId: "default-1", uptime: "22d 1h", lastSeen: "Just now" },
];

export const SCREEN_SETTINGS = {
  tickerMessage: "CAMPUS NEWS: Faculty meeting at 4 PM in Conference Room B • New cafeteria menu launched today! • Registration for Spring Semester opens next Monday.",
  emergencyAlert: false,
  locationName: "Main Campus Hall",
  activePlaylistId: "system-default",
};

export const PLAYLISTS: Playlist[] = [
  {
    id: "system-default",
    name: "System: Info Hub",
    description: "Built-in dynamic card containing Clock, Weather, and AQI modules. Managed by system settings.",
    items: ['1', '3'],
    isSystem: true,
    schedule: "Always Active (24/7)",
  },
  {
    id: "default-1",
    name: "Standard Campus Loop",
    description: "Main rotation for general announcements and science facts.",
    items: ['1', '2', '3', '5'],
    schedule: "Mon-Fri, 08:00 - 18:00",
  },
  {
    id: "default-2",
    name: "Quiet Study",
    description: "Calm visuals and library-specific information for study zones.",
    items: ['3', '5'],
    schedule: "Mon-Sat, 09:00 - 21:00",
  }
];

export const WORSHIP_SCHEDULES: WorshipSchedule[] = [
  { id: 'w1', name: 'Morning Prayer', time: '07:30', location: 'Campus Chapel', frequency: 'Daily', active: true },
  { id: 'w2', name: 'Midday Meditation', time: '12:15', location: 'Garden Room', frequency: 'Mon-Fri', active: true },
  { id: 'w3', name: 'Evening Vespers', time: '18:00', location: 'Main Sanctuary', frequency: 'Weekly (Sun)', active: true },
];
