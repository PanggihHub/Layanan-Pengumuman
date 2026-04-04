"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  History,
  FileText,
  Search,
  X,
  Settings2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Protocol {
  id: string;
  icon: any;
  label: string;
  color: string;
  text: string;
}

export default function EmergencyPlatform() {
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProtocolDialogOpen, setIsProtocolDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  
  const { toast } = useToast();

  const [protocols, setProtocols] = useState<Protocol[]>([
    { id: 'fire', icon: Flame, label: 'Fire / Evacuation', color: 'bg-orange-500', text: 'SHELTER IN PLACE / EVACUATE' },
    { id: 'weather', icon: CloudRain, label: 'Severe Weather', color: 'bg-blue-600', text: 'SEEK INDOOR SHELTER' },
    { id: 'lockdown', icon: Lock, label: 'Security Lockdown', color: 'bg-red-800', text: 'LOCKDOWN IN EFFECT' },
    { id: 'hazard', icon: ShieldAlert, label: 'Biohazard / Spill', color: 'bg-yellow-600', text: 'HAZMAT ALERT - DO NOT ENTER' },
  ]);

  const [logs, setLogs] = useState([
    { id: 1, time: "2m ago", text: "System Test: Connectivity validation", type: "system" },
    { id: 2, time: "1h ago", text: "Safety drill completed: Main Hall", type: "drill" },
    { id: 3, time: "3h ago", text: "Heartbeat: All 24 screens connected", type: "sync" },
  ]);

  // Form states for protocol
  const [protoLabel, setProtoLabel] = useState("");
  const [protoText, setProtoText] = useState("");
  const [protoColor, setProtoColor] = useState("bg-red-600");

  const handleTriggerAlert = (id: string) => {
    const protocol = protocols.find(p => p.id === id);
    setIsProcessing(true);
    setTimeout(() => {
      setActiveAlert(id);
      setIsProcessing(false);
      
      const logEntry = {
        id: Date.now(),
        time: "Just now",
        text: `BROADCAST ACTIVE: ${protocol?.label || 'General Panic'}`,
        type: "alert"
      };
      setLogs(prev => [logEntry, ...prev]);

      toast({
        variant: "destructive",
        title: "EMERGENCY BROADCAST ACTIVE",
        description: `Protocol ${protocol?.label.toUpperCase() || 'PANIC'} deployed to all network nodes.`,
      });
    }, 2000);
  };

  const handleClear = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setActiveAlert(null);
      setIsProcessing(false);
      
      setLogs(prev => [
        { id: Date.now(), time: "Just now", text: "Protocol Reset: All screens cleared", type: "system" },
        ...prev
      ]);

      toast({
        title: "All Clear",
        description: "Emergency broadcast terminated. Resuming standard playlists.",
      });
    }, 1500);
  };

  const handleOpenAddProtocol = () => {
    setEditingProtocol(null);
    setProtoLabel("");
    setProtoText("");
    setProtoColor("bg-red-600");
    setIsProtocolDialogOpen(true);
  };

  const handleOpenEditProtocol = (p: Protocol) => {
    setEditingProtocol(p);
    setProtoLabel(p.label);
    setProtoText(p.text);
    setProtoColor(p.color);
    setIsProtocolDialogOpen(true);
  };

  const handleSaveProtocol = () => {
    if (!protoLabel || !protoText) return;

    if (editingProtocol) {
      setProtocols(prev => prev.map(p => p.id === editingProtocol.id ? { ...p, label: protoLabel, text: protoText, color: protoColor } : p));
    } else {
      const newProtocol: Protocol = {
        id: Math.random().toString(36).substr(2, 9),
        icon: AlertTriangle,
        label: protoLabel,
        text: protoText,
        color: protoColor
      };
      setProtocols(prev => [...prev, newProtocol]);
    }
    setIsProtocolDialogOpen(false);
  };

  const handleDeleteProtocol = (id: string) => {
    setProtocols(prev => prev.filter(p => p.id !== id));
  };

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setIsRefreshingLogs(false);
      toast({ title: "Logs Updated", description: "Audit trail synchronized." });
    }, 800);
  };

  const activeProtocol = protocols.find(p => p.id === activeAlert);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            Emergency Orchestration Platform
          </h1>
          <p className="text-muted-foreground mt-2">High-priority override console for campus safety protocols.</p>
        </div>
        <div className="flex gap-2">
          {activeAlert && (
            <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handleClear} disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="animate-spin" /> : "Clear Emergency State"}
            </Button>
          )}
          <Button onClick={handleOpenAddProtocol} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Protocol
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "transition-all border-4",
            activeAlert ? "border-red-600 animate-pulse bg-red-50/50" : "border-muted"
          )}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Protocol Selection
                    {activeAlert && <Badge variant="destructive" className="animate-bounce">ACTIVE OVERRIDE</Badge>}
                  </CardTitle>
                  <CardDescription>Select a protocol to broadcast instantly across the network.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {protocols.map((alert) => (
                  <div key={alert.id} className="relative group">
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-32 flex flex-col items-center justify-center gap-3 border-2 transition-all",
                        activeAlert === alert.id ? "bg-red-600 text-white border-red-900" : "hover:border-primary/50"
                      )}
                      onClick={() => handleTriggerAlert(alert.id)}
                      disabled={isProcessing || activeAlert !== null}
                    >
                      <alert.icon className={cn("w-10 h-10", activeAlert === alert.id ? "text-white" : "text-red-500")} />
                      <span className="font-bold uppercase tracking-tight text-xs">{alert.label}</span>
                    </Button>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-7 w-7">
                            <Settings2 className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditProtocol(alert)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProtocol(alert.id)} className="text-red-600">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 text-white border-none overflow-hidden ring-1 ring-white/10">
            <CardHeader className="bg-red-600/20 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Live Broadcast Intercept
              </CardTitle>
              <Badge variant="outline" className="text-white border-white/20 text-[9px]">ACTIVE FEED</Badge>
            </CardHeader>
            <CardContent className="aspect-video relative flex flex-col items-center justify-center p-0 overflow-hidden bg-black">
              {activeAlert ? (
                <div className={cn(
                  "w-full h-full flex flex-col items-center justify-center p-12 text-center transition-colors animate-pulse",
                  activeProtocol?.color || 'bg-red-600'
                )}>
                   <AlertTriangle className="w-24 h-24 mb-6" />
                   <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter leading-none">Emergency Alert</h2>
                   <p className="text-xl font-bold uppercase">{activeProtocol?.text}</p>
                </div>
              ) : (
                <div className="text-white/10 flex flex-col items-center italic gap-3">
                  <EyeOff className="w-16 h-16" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No Active Signal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-red-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-600">Master Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="destructive" 
                className="w-full h-16 font-black gap-2 text-lg shadow-xl shadow-red-200" 
                onClick={() => handleTriggerAlert('panic')} 
                disabled={isProcessing || activeAlert !== null}
              >
                <Zap className="w-6 h-6 fill-white" />
                PANIC OVERRIDE
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-14 border-zinc-900 border-2 font-black gap-2" 
                onClick={handleClear} 
                disabled={!activeAlert || isProcessing}
              >
                <Power className="w-5 h-5" />
                SYSTEM RESET
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Emergency Log
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshLogs}>
                <RefreshCw className={cn("w-3 h-3", isRefreshingLogs && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      log.type === 'alert' ? 'bg-red-600 animate-pulse' : 'bg-muted-foreground'
                    )} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{log.text}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="link" 
                className="w-full p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-red-600 gap-2"
                onClick={() => setIsHistoryOpen(true)}
              >
                View Full Audit History <History className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Protocol CRUD Dialog */}
      <Dialog open={isProtocolDialogOpen} onOpenChange={setIsProtocolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProtocol ? "Modify Protocol" : "Add Emergency Protocol"}</DialogTitle>
            <DialogDescription>Define the broadcast parameters for this safety response.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Protocol Name (Internal)</Label>
              <Input value={protoLabel} onChange={e => setProtoLabel(e.target.value)} placeholder="e.g. Chemical Leak" />
            </div>
            <div className="space-y-2">
              <Label>Display Message (Public)</Label>
              <Input value={protoText} onChange={e => setProtoText(e.target.value)} placeholder="e.g. HAZMAT ALERT - DO NOT ENTER" />
            </div>
            <div className="space-y-2">
              <Label>System Color</Label>
              <Select value={protoColor} onValueChange={setProtoColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-red-600">Crisis Red</SelectItem>
                  <SelectItem value="bg-orange-500">Warning Orange</SelectItem>
                  <SelectItem value="bg-blue-600">Info Blue</SelectItem>
                  <SelectItem value="bg-yellow-600">Caution Yellow</SelectItem>
                  <SelectItem value="bg-zinc-900">Blackout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsProtocolDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProtocol}>Save Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-red-600" />
              Full Emergency Audit Trail
            </DialogTitle>
            <DialogDescription>A complete log of all safety protocol triggers and system resets.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[350px] pr-4 mt-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20">
                  <div className={cn(
                    "p-2 rounded-full",
                    log.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold">{log.text}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{log.time}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mt-1">
                      Category: {log.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
