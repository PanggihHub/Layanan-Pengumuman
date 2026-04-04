"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  CloudRain, 
  Lock, 
  Power,
  RefreshCw,
  Zap,
  Radio,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function EmergencyPlatform() {
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTriggerAlert = (type: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setActiveAlert(type);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "EMERGENCY BROADCAST ACTIVE",
        description: `Protocol ${type.toUpperCase()} deployed to all network nodes.`,
      });
    }, 2000);
  };

  const handleClear = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setActiveAlert(null);
      setIsProcessing(false);
      toast({
        title: "All Clear",
        description: "Emergency broadcast terminated. Resuming standard playlists.",
      });
    }, 1500);
  };

  const alertTypes = [
    { id: 'fire', icon: Flame, label: 'Fire / Evacuation', color: 'bg-orange-500', text: 'SHELTER IN PLACE / EVACUATE' },
    { id: 'weather', icon: CloudRain, label: 'Severe Weather', color: 'bg-blue-600', text: 'SEEK INDOOR SHELTER' },
    { id: 'lockdown', icon: Lock, label: 'Security Lockdown', color: 'bg-red-800', text: 'LOCKDOWN IN EFFECT' },
    { id: 'hazard', icon: ShieldAlert, label: 'Biohazard / Spill', color: 'bg-yellow-600', text: 'HAZMAT ALERT - DO NOT ENTER' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            Emergency Orchestration Platform
          </h1>
          <p className="text-muted-foreground mt-2">High-priority override console for campus safety protocols.</p>
        </div>
        {activeAlert && (
          <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handleClear} disabled={isProcessing}>
            {isProcessing ? <RefreshCw className="animate-spin" /> : "Clear Emergency State"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "transition-all border-4",
            activeAlert ? "border-red-600 animate-pulse bg-red-50/50" : "border-muted"
          )}>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                Protocol Selection
                {activeAlert && <Badge variant="destructive" className="animate-bounce">ACTIVE OVERRIDE</Badge>}
              </CardTitle>
              <CardDescription>Select a protocol to broadcast instantly across the entire screen network.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {alertTypes.map((alert) => (
                  <Button
                    key={alert.id}
                    variant="outline"
                    className={cn(
                      "h-32 flex flex-col items-center justify-center gap-3 border-2 transition-all",
                      activeAlert === alert.id ? "bg-red-600 text-white border-red-900" : "hover:border-primary/50"
                    )}
                    onClick={() => handleTriggerAlert(alert.id)}
                    disabled={isProcessing || activeAlert !== null}
                  >
                    <alert.icon className={cn("w-10 h-10", activeAlert === alert.id ? "text-white" : "text-red-500")} />
                    <span className="font-bold uppercase tracking-tight">{alert.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 text-white border-none overflow-hidden">
            <CardHeader className="bg-red-600/20 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Live Broadcast Intercept
              </CardTitle>
              <Badge variant="outline" className="text-white border-white/20">LIVE PROXY</Badge>
            </CardHeader>
            <CardContent className="aspect-video relative flex flex-col items-center justify-center p-0">
              {activeAlert ? (
                <div className={cn(
                  "w-full h-full flex flex-col items-center justify-center p-12 text-center transition-colors",
                  alertTypes.find(a => a.id === activeAlert)?.color
                )}>
                   <AlertTriangle className="w-32 h-32 mb-6" />
                   <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter">Emergency Alert</h2>
                   <p className="text-2xl font-bold">{alertTypes.find(a => a.id === activeAlert)?.text}</p>
                </div>
              ) : (
                <div className="text-white/20 flex flex-col items-center italic gap-3">
                  <EyeOff className="w-16 h-16" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Active Overrides</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-red-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-red-600">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive" className="w-full h-14 font-black gap-2" onClick={() => handleTriggerAlert('general')} disabled={isProcessing || activeAlert !== null}>
                <Zap className="w-5 h-5 fill-white" />
                PANIC BROADCAST
              </Button>
              <Button variant="outline" className="w-full h-14 border-zinc-900 border-2 font-black gap-2" onClick={handleClear} disabled={!activeAlert || isProcessing}>
                <Power className="w-5 h-5" />
                SYSTEM RESET
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">Network Telemetry</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Reachable Screens</span>
                <span className="font-bold">24 / 24</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Signal Latency</span>
                <span className="font-bold text-emerald-600">42ms</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Broadcast Status</span>
                <span className={cn("font-bold", activeAlert ? "text-red-600" : "text-emerald-600")}>
                  {activeAlert ? "OVERRIDE" : "NOMINAL"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
