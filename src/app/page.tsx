"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Monitor, LayoutDashboard, School, Link2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const router = useRouter();
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-signage');
  
  const [isPairDialogOpen, setIsPairDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [pairingSuccess, setPairingSuccess] = useState(false);

  const getDeviceId = () => {
    if (typeof window === "undefined") return "server";
    let id = localStorage.getItem("screensense_device_id");
    if (!id) {
      id = "DISP-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem("screensense_device_id", id);
    }
    return id;
  };

  const handleStartPairing = async () => {
    setIsPairDialogOpen(true);
    const id = getDeviceId();
    setDeviceId(id);
    
    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPairingCode(code);
    
    // Persist to firestore
    try {
      await setDoc(doc(db, "pairingCodes", id), {
        deviceId: id,
        code: code,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to generate pairing code", e);
    }
  };

  useEffect(() => {
    if (!isPairDialogOpen || !deviceId) return;

    let successHandled = false;
    // Listen for this device being provisioned in the screens collection
    const unsub = onSnapshot(doc(db, "screens", deviceId), (snap) => {
      if (snap.exists() && !successHandled) {
        successHandled = true;
        setPairingSuccess(true);
        setTimeout(() => {
          setIsPairDialogOpen(false);
          setPairingSuccess(false);
          router.push("/display");
        }, 3000);
      }
    });

    return () => unsub();
  }, [isPairDialogOpen, deviceId, router]);

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
          <div className="flex flex-row items-center justify-center md:justify-start gap-4 flex-wrap">
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
            <Button variant="secondary" size="lg" className="h-14 px-8 text-lg gap-2" onClick={handleStartPairing}>
              <Link2 className="w-5 h-5" />
              Pair Device
            </Button>
          </div>
        </div>

        <Dialog open={isPairDialogOpen} onOpenChange={setIsPairDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl text-center flex flex-col items-center py-10">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-primary">Pair This Screen</DialogTitle>
              <DialogDescription className="text-lg">
                Enter this 6-digit code in the Admin Dashboard to link this display to your network.
              </DialogDescription>
            </DialogHeader>
            <div className="my-8 space-y-4 w-full">
              <div className="bg-muted/30 p-8 rounded-3xl border-2 border-primary/10 shadow-inner">
                {pairingSuccess ? (
                  <h2 className="text-4xl font-black text-green-600 animate-in zoom-in">PAIRED SUCCESSFULLY</h2>
                ) : pairingCode ? (
                  <h2 className="text-6xl font-black tracking-[0.2em] text-primary">{pairingCode}</h2>
                ) : (
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary/40" />
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground bg-muted w-fit mx-auto px-3 py-1 rounded-full">
                DEVICE_ID: {deviceId}
              </p>
            </div>
            {pairingSuccess ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-bold">
                Redirecting to master display...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <RefreshCw className="w-4 h-4" />
                Waiting for admin approval...
              </div>
            )}
          </DialogContent>
        </Dialog>

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
