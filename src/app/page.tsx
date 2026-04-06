import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Monitor, LayoutDashboard, School } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-signage');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2">
          <Monitor className="text-primary h-8 w-8" />
          <h1 className="text-2xl font-bold text-primary">ScreenSense</h1>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
          Digital Signage Orchestration
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-12 max-w-7xl mx-auto">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 w-fit mx-auto md:mx-0">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <School className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Official Platform</p>
              <p className="text-sm font-bold text-primary">Yogya State University</p>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            Next-Gen Intelligence for Your <span className="text-accent">Digital Displays</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            ScreenSense transforms static screens into interactive learning hubs. Manage content, automate playlists, and ensure seamless communication across your entire campus network.
          </p>
          <div className="flex flex-row items-center justify-center md:justify-start gap-4">
            <Link href="/admin">
              <Button size="lg" className="h-14 px-8 text-lg gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Button>
            </Link>
            <Link href="/display">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg gap-2">
                <Monitor className="w-5 h-5" />
                Signage Client
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md md:max-w-none">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <Image
              src={heroImg?.imageUrl || 'https://picsum.photos/seed/screensense1/1920/1080'}
              alt="ScreenSense Dashboard Preview"
              fill
              className="object-cover"
              data-ai-hint="digital signage"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
          </div>
        </div>
      </main>

      <footer className="p-12 border-t bg-white flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3 grayscale opacity-60">
           <School className="w-6 h-6" />
           <span className="text-xs font-bold uppercase tracking-widest">Universitas Negeri Yogyakarta</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Created by : RP support by Firebase Studio
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-2">
          &copy; {new Date().getFullYear()} ScreenSense Systems. Built for clarity and intelligence.
        </p>
      </footer>
    </div>
  );
}
