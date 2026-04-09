import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export const getMediaThumbnail = (url: string, type: string) => {
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`; // Use maxres for better quality
  
  if (type === 'website') {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=256&domain=${domain}`;
    } catch {
      return "https://www.google.com/s2/favicons?sz=256&domain=example.com";
    }
  }
  
  if (type === 'clock') return "https://img.icons8.com/isometric/512/clock.png"; // Premium isometric icon
  if (type === 'weather') return "https://img.icons8.com/isometric/512/cloud.png"; // Premium isometric icon
  
  return url || 'https://picsum.photos/seed/placeholder/1920/1080';
};

