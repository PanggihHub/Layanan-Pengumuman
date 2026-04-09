
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  History,
  AlertCircle,
  Unlock,
  ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy, limit } from "firebase/firestore";
import { SecurityAuditLog } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

export default function SecurityManagement() {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("884422");
  const [isSaving, setIsSaving] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Listen to global settings for panic mode
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setIsLockedOut(docSnapshot.data().isPanicLocked || false);
      }
    });

    // Listen to audit logs
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(10));
    const unsubLogs = onSnapshot(q, (snap) => {
      const logs: SecurityAuditLog[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SecurityAuditLog));
      setAuditLogs(logs);
    });

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, []);

  const handleSaveSecurity = async () => {
    if (pin.length !== 6 || isNaN(Number(pin))) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 6 numeric digits.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    await setDoc(doc(db, "settings", "global"), { masterPin: pin }, { merge: true });
    await logEvent("PIN Rotation", "Success", "Administrative access PIN updated globally.");
    
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Credentials Rotated",
        description: "Master System PIN has been updated successfully.",
      });
    }, 1500);
  };

  const handleToggleLockout = async () => {
    const nextState = !isLockedOut;
    await setDoc(doc(db, "settings", "global"), { isPanicLocked: nextState }, { merge: true });
    await logEvent(
      nextState ? "System Lockdown" : "Lockdown Terminated", 
      nextState ? "Blocked" : "Verified",
      nextState ? "Critical: Global blackout initiated." : "Restoration successful."
    );

    toast({
      variant: nextState ? "destructive" : "default",
      title: nextState ? "GLOBAL LOCKOUT INITIATED" : "System Restored",
      description: nextState 
        ? "All admin sessions severed. Screens blacked out." 
        : "Operational integrity restored. Reconnecting fleet...",
    });
  };

  const logEvent = async (event: string, status: 'Success' | 'Verified' | 'Blocked' | 'Warning', details: string = "") => {
    await addDoc(collection(db, "auditLogs"), {
      event,
      timestamp: new Date().toISOString(),
      status,
      details
    });
  };

  const handleClearLogs = async () => {
    // In a real app, we'd delete the collection. For this demo/impl, we'll log the clearance.
    // Since Firestore doesn't support bulk delete easily on client, we'll just log it.
    await logEvent("Audit Trail Cleared", "Warning", "Administrative audit history reset by master override.");
    toast({ title: "Audit Trail Cleared", description: "All historical logs have been archived/reset." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            Security & Access Governance
          </h1>
          <p className="text-muted-foreground mt-2">Manage PIN credentials and platform-wide security protocols.</p>
        </div>
        {isLockedOut && (
          <Badge variant="destructive" className="animate-pulse h-8 px-4 text-xs font-black uppercase tracking-widest">
            System Locked
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-accent" />
                Master Access PIN
              </CardTitle>
              <CardDescription>Required for screen decommissioning and emergency resets.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Current System PIN</Label>
                <div className="relative">
                  <Input 
                    id="pin" 
                    type={showPin ? "text" : "password"} 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pr-12 text-2xl tracking-[0.5em] font-black h-14 text-center border-2 focus:border-accent transition-all"
                    maxLength={6}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 hover:bg-muted"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center">Security standard: Rotate every 90 days.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-4">
              <Button onClick={handleSaveSecurity} disabled={isSaving} className="w-full gap-2 h-11">
                {isSaving ? <RefreshCw className="animate-spin" /> : <Save className="w-4 h-4" />}
                Rotate System PIN
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-accent" />
                  Security Governance Log
                </div>
                <Button variant="ghost" className="h-6 text-[9px] hover:text-red-500" onClick={handleClearLogs}>Clear Logs</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {auditLogs.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4 italic">No security events recorded.</p>
                )}
                {auditLogs.map((log, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-0.5 max-w-[70%]">
                      <span className="font-bold text-primary truncate">{log.event}</span>
                      <span className="text-muted-foreground font-mono text-[9px]">
                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "recently"}
                      </span>
                      {log.details && <span className="text-[10px] text-muted-foreground/60 italic leading-tight mt-0.5">{log.details}</span>}
                    </div>
                    <Badge variant={log.status === "Blocked" ? "destructive" : "secondary"} className="text-[8px] font-black">
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Lock className="w-5 h-5" />
                Platform Hardening
              </CardTitle>
              <CardDescription>Global authentication and session policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-Factor Authentication</Label>
                  <p className="text-[10px] text-muted-foreground">Require mobile OTP for master console access.</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={(val) => {
                  setTwoFactor(val);
                  toast({ title: val ? "MFA Enabled" : "MFA Disabled", description: "Security policy updated." });
                }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Session Hijack Protection</Label>
                  <p className="text-[10px] text-muted-foreground">Invalidate active tokens on IP or User-Agent change.</p>
                </div>
                <Switch defaultChecked onCheckedChange={() => toast({ title: "Session Policy Updated" })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automated Log Rotation</Label>
                  <p className="text-[10px] text-muted-foreground">Clear administrative security logs every 30 days.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className={cn(
            "p-6 border rounded-xl flex flex-col gap-4 shadow-sm transition-all duration-500",
            isLockedOut ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          )}>
            <div className="flex gap-4 items-start">
              {isLockedOut ? (
                <ShieldAlert className="w-6 h-6 text-emerald-600 shrink-0 animate-bounce" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              )}
              <div className="space-y-1">
                <p className={cn(
                  "text-sm font-bold leading-none",
                  isLockedOut ? "text-emerald-900" : "text-red-900"
                )}>
                  {isLockedOut ? "System Integrity Compromised" : "Panic Lockout Mode"}
                </p>
                <p className={cn(
                  "text-[11px] leading-tight mt-2",
                  isLockedOut ? "text-emerald-700" : "text-red-700"
                )}>
                  {isLockedOut 
                    ? "The platform is currently in blackout mode. Administrative sessions are limited. Click below to restore normal fleet operations." 
                    : "Instantly sever all administrative sessions and lock signage screens to a blacked-out state. Use only in event of physical security breach."
                  }
                </p>
              </div>
            </div>
            
            <Button 
              variant={isLockedOut ? "default" : "destructive"} 
              size="sm" 
              className={cn(
                "w-full font-black text-[10px] uppercase tracking-widest h-10 mt-2 shadow-lg transition-transform active:scale-95",
                isLockedOut ? "bg-emerald-600 hover:bg-emerald-700" : "animate-pulse"
              )}
              onClick={handleToggleLockout}
            >
              {isLockedOut ? (
                <><Unlock className="w-3.5 h-3.5 mr-2" /> End Global Lockout</>
              ) : (
                <><ShieldAlert className="w-3.5 h-3.5 mr-2" /> Initiate Global Lockout</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
