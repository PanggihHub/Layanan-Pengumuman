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
}

export const INITIAL_MEDIA: MediaItem[] = [
  { id: '1', name: 'Orientation_Hero.jpg', type: 'image', size: '2.4 MB', date: '2023-10-12', url: 'https://picsum.photos/seed/screensense1/1920/1080', category: 'campus' },
  { id: '2', name: 'Science_Fact_Photosynthesis.mp4', type: 'video', size: '45.1 MB', date: '2023-10-14', url: 'https://picsum.photos/seed/science/1920/1080', category: 'science' },
  { id: '3', name: 'Campus_Map_Vertical.png', type: 'image', size: '1.8 MB', date: '2023-10-15', url: 'https://picsum.photos/seed/campus/1920/1080', category: 'campus' },
  { id: '4', name: 'Welcome_Slide_V2.jpg', type: 'image', size: '3.2 MB', date: '2023-10-16', url: 'https://picsum.photos/seed/display/1920/1080', category: 'events' },
  { id: '5', name: 'Prime_Numbers_Grid.png', type: 'image', size: '1.2 MB', date: '2023-10-18', url: 'https://picsum.photos/seed/math/1920/1080', category: 'math' },
  { id: '6', name: 'Cafeteria_Menu.pdf', type: 'document', size: '0.5 MB', date: '2023-10-20', url: 'https://picsum.photos/seed/food/1920/1080', category: 'events' },
];

export const SCREEN_SETTINGS = {
  tickerMessage: "CAMPUS NEWS: Faculty meeting at 4 PM in Conference Room B • New cafeteria menu launched today! • Registration for Spring Semester opens next Monday.",
  emergencyAlert: false,
  locationName: "Main Campus Hall",
  activePlaylistId: "default-1",
};

export const PLAYLISTS = [
  {
    id: "default-1",
    name: "Standard Campus Loop",
    items: ['1', '2', '3', '5'],
  }
];
