"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
  CardDescription, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Lock, Key, Eye, EyeOff, Save, RefreshCw,
  History, AlertCircle, Unlock, ShieldAlert, ShieldCheck,
  LogIn, Settings, UserX, Fingerprint, Filter, Archive,
  CheckCircle2, XCircle, AlertTriangle, Info, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, doc, setDoc, getDoc,
  query, orderBy, limit,
} from "firebase/firestore";
import { SecurityAuditLog } from "@/lib/mock-data";
import { AuditLogger } from "@/lib/audit-logger";
import { formatDistanceToNow, format } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const LOG_PREVIEW_LIMIT = 8;       // entries shown in the security page card
const LOG_ARCHIVE_LIMIT = 200;     // entries loaded in the full archive dialog

type LogStatus   = SecurityAuditLog["status"];
type LogCategory = SecurityAuditLog["category"];

// ── Status badge config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LogStatus, { label: string; cls: string; icon: React.ElementType }> = {
  Success:  { label: "SUCCESS",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200",  icon: CheckCircle2   },
  Verified: { label: "VERIFIED", cls: "bg-sky-100     text-sky-700     border-sky-200",      icon: ShieldCheck    },
  Warning:  { label: "WARNING",  cls: "bg-amber-100   text-amber-700   border-amber-200",    icon: AlertTriangle  },
  Failed:   { label: "FAILED",   cls: "bg-rose-100    text-rose-700    border-rose-200",     icon: XCircle        },
  Blocked:  { label: "BLOCKED",  cls: "bg-red-100     text-red-700     border-red-200 animate-pulse", icon: AlertCircle },
};

const CATEGORY_CONFIG: Record<LogCategory, { label: string; icon: React.ElementType; color: string }> = {
  auth:    { label: "Authentication", icon: LogIn,       color: "text-sky-600"     },
  config:  { label: "Configuration",  icon: Settings,    color: "text-violet-600"  },
  access:  { label: "Access",         icon: Key,         color: "text-primary"     },
  lockout: { label: "Lockout",        icon: Lock,        color: "text-red-600"     },
  system:  { label: "System",         icon: ShieldCheck, color: "text-emerald-600" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SecurityManagement() {
  const { t, language }   = useLanguage();
  const { toast }         = useToast();

  // ------ State -----
  const [showPin, setShowPin]         = useState(false);
  const [newPin, setNewPin]           = useState("");
  const [confirmPin, setConfirmPin]   = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Panic lockout state
  const [isLockedOut, setIsLockedOut]             = useState(false);
  const [showLockDialog, setShowLockDialog]       = useState(false);
  const [showUnlockDialog, setShowUnlockDialog]   = useState(false);
  const [pinChallenge, setPinChallenge]           = useState("");
  const [challengeError, setChallengeError]       = useState("");
  const [isProcessingLock, setIsProcessingLock]   = useState(false);

  // Security hardening toggles
  const [twoFactor, setTwoFactor]         = useState(true);
  const [hijackProtect, setHijackProtect] = useState(true);
  const [logRotation, setLogRotation]     = useState(true);

  // Audit logs
  const [allLogs, setAllLogs]         = useState<SecurityAuditLog[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Filters (only applied in archive dialog)
  const [filterStatus,   setFilterStatus]   = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSearch,   setFilterSearch]   = useState("");

  // ------ Firestore subscriptions ------
  useEffect(() => {
    // Panic mode
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) setIsLockedOut(snap.data().isPanicLocked ?? false);
    });

    // Audit logs — fetch the full archive set, preview slices it in UI
    const q = query(
      collection(db, "securityLogs"),
      orderBy("timestamp", "desc"),
      limit(LOG_ARCHIVE_LIMIT)
    );
    const unsubLogs = onSnapshot(q, (snap) => {
      setAllLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SecurityAuditLog)));
    });

    // Log page visit
    AuditLogger.access("Security Dashboard Accessed", "Success", "Admin opened Security & PIN management page.");

    return () => { unsubSettings(); unsubLogs(); };
  }, []);

  // ------ Preview: always 8 most recent ------
  const previewLogs = useMemo(() => allLogs.slice(0, LOG_PREVIEW_LIMIT), [allLogs]);

  // ------ Filtered archive logs ------
  const filteredArchiveLogs = useMemo(() => {
    return allLogs.filter(log => {
      if (filterStatus   !== "all" && log.status   !== filterStatus)   return false;
      if (filterCategory !== "all" && log.category !== filterCategory)  return false;
      if (filterSearch && !log.event.toLowerCase().includes(filterSearch.toLowerCase()) &&
          !(log.details ?? "").toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [allLogs, filterStatus, filterCategory, filterSearch]);

  // ------ PIN rotation ------
  const handleSavePin = async () => {
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      toast({ title: "Invalid PIN", description: "PIN must be exactly 6 numeric digits.", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PIN Mismatch", description: "Both fields must match.", variant: "destructive" });
      return;
    }
    setIsSavingPin(true);
    await setDoc(doc(db, "settings", "global"), { masterPin: newPin }, { merge: true });
    await AuditLogger.auth("Master PIN Rotated", "Success", "Administrative access PIN updated globally.");
    setNewPin(""); setConfirmPin("");
    setTimeout(() => {
      setIsSavingPin(false);
      toast({ title: "PIN Updated", description: "Master System PIN has been rotated successfully." });
    }, 800);
  };

  // ------ PIN challenge validation ------
  const verifyPinChallenge = async (): Promise<boolean> => {
    if (pinChallenge.length !== 6) {
      setChallengeError("Enter your 6-digit master PIN to continue.");
      return false;
    }
    const snap = await getDoc(doc(db, "settings", "global"));
    const storedPin = snap.exists() ? snap.data().masterPin : "";
    if (pinChallenge === storedPin || (!storedPin && pinChallenge === "884422")) {
      setChallengeError(""); return true;
    }
    setChallengeError("Incorrect PIN. Access denied.");
    await AuditLogger.blocked("Panic Lockout Auth Failed", `Incorrect PIN entered during lockout attempt.`);
    return false;
  };

  // ------ Initiate lockout ------
  const handleInitiateLock = async () => {
    setIsProcessingLock(true);
    const ok = await verifyPinChallenge();
    if (!ok) { setIsProcessingLock(false); return; }

    await setDoc(doc(db, "settings", "global"), {
      isPanicLocked: true,
      panicLockedAt: new Date().toISOString(),
    }, { merge: true });
    await AuditLogger.lockout(
      "⚠️ Emergency Panic Lockout Initiated",
      "Blocked",
      "Critical: All display output terminated. Admin-verified emergency override."
    );
    setShowLockDialog(false); setPinChallenge(""); setIsProcessingLock(false);
    toast({
      variant: "destructive",
      title: "GLOBAL LOCKOUT ACTIVE",
      description: "All screens blacked out. Fleet output suspended. PIN required to restore.",
    });
  };

  // ------ Terminate lockout ------
  const handleTerminateLock = async () => {
    setIsProcessingLock(true);
    const ok = await verifyPinChallenge();
    if (!ok) { setIsProcessingLock(false); return; }

    await setDoc(doc(db, "settings", "global"), {
      isPanicLocked: false,
      panicLockedAt: null,
    }, { merge: true });
    await AuditLogger.lockout(
      "Panic Lockout Terminated",
      "Verified",
      "System restored by authenticated admin. Fleet output resumed."
    );
    setShowUnlockDialog(false); setPinChallenge(""); setIsProcessingLock(false);
    toast({ title: "System Restored", description: "Lockout lifted. Fleet is reconnecting…" });
  };

  // ------ Export logs ------
  const handleExportLogs = () => {
    const csv = [
      "timestamp,event,status,category,user,details,ip",
      ...allLogs.map(l =>
        `"${l.timestamp}","${l.event}","${l.status}","${l.category ?? ""}","${l.user ?? ""}","${(l.details ?? "").replace(/"/g, "'")}","${l.ip ?? ""}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `security-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    AuditLogger.system("Audit Log Exported", "Success", `${allLogs.length} entries exported as CSV.`);
  };

  // ── Log row renderer ─────────────────────────────────────────────────────────
  const LogRow = ({
    log, compact = true,
  }: { log: SecurityAuditLog; compact?: boolean }) => {
    const sc = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.Warning;
    const cc = CATEGORY_CONFIG[log.category as LogCategory] ?? CATEGORY_CONFIG.system;
    const StatusIcon   = sc.icon;
    const CategoryIcon = cc.icon;
    return (
      <div className={cn(
        "flex items-start gap-3 border-b last:border-0 transition-colors hover:bg-muted/30",
        compact ? "py-3 px-1" : "py-4 px-4 rounded-xl border bg-white shadow-sm dark:bg-zinc-900"
      )}>
        {/* Category icon dot */}
        <div className={cn("mt-0.5 shrink-0", cc.color)}>
          <CategoryIcon className="w-4 h-4" />
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary leading-snug truncate">{log.event}</p>
          {log.details && (
            <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5 line-clamp-2 italic pr-4">
              {log.details}
            </p>
          )}
          <p className="text-[9px] text-muted-foreground font-mono mt-1 uppercase tracking-widest">
            {log.timestamp
              ? compact
                ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                : format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss")
              : "—"
            }
            {log.user && ` · ${log.user}`}
            {log.ip   && ` · ${log.ip}`}
          </p>
        </div>
        {/* Status badge */}
        <Badge
          variant="outline"
          className={cn("text-[8px] font-black tracking-widest flex items-center gap-1 shrink-0 border", sc.cls)}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          {sc.label}
        </Badge>
      </div>
    );
  };

  // ── PIN Challenge dialog content ─────────────────────────────────────────────
  const PinChallengeForm = ({
    title, subtitle, onConfirm, destructive = false,
  }: {
    title: string; subtitle: string;
    onConfirm: () => void; destructive?: boolean;
  }) => (
    <div className="space-y-5 pt-2">
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="space-y-2">
        <Label>Master PIN</Label>
        <div className="relative">
          <Input
            type={showPin ? "text" : "password"}
            maxLength={6}
            value={pinChallenge}
            onChange={e => { setPinChallenge(e.target.value.replace(/\D/g, "")); setChallengeError(""); }}
            onKeyDown={e => e.key === "Enter" && onConfirm()}
            className={cn(
              "text-center text-2xl tracking-[0.5em] font-black h-14 font-mono",
              challengeError ? "border-red-400 focus-visible:ring-red-400" : ""
            )}
            placeholder="••••••"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setShowPin(v => !v)}>
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        {challengeError && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> {challengeError}
          </p>
        )}
      </div>
      <Button
        onClick={onConfirm}
        disabled={isProcessingLock || pinChallenge.length !== 6}
        className={cn(
          "w-full h-12 font-black uppercase tracking-widest text-xs gap-2",
          destructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
        )}
      >
        {isProcessingLock
          ? <RefreshCw className="w-4 h-4 animate-spin" />
          : destructive ? <ShieldAlert className="w-4 h-4" /> : <Unlock className="w-4 h-4" />
        }
        {isProcessingLock ? "Verifying…" : title}
      </Button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
            <Shield className="w-10 h-10 text-accent p-2 bg-accent/10 rounded-2xl" />
            Security &amp; Access Control
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            PIN management, emergency lockout, security hardening, and real-time audit log.
          </p>
        </div>
        {isLockedOut && (
          <Badge variant="destructive" className="animate-pulse h-9 px-5 text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/30 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            GLOBAL LOCKOUT ACTIVE
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* PIN Rotation */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 border-b py-5 px-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-accent" /> Master Access PIN
              </CardTitle>
              <CardDescription>
                Rotate the 6-digit PIN used for admin access, emergency lockout authentication, and paired device operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pin">New PIN</Label>
                  <div className="relative">
                    <Input
                      id="new-pin"
                      type={showPin ? "text" : "password"}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
                      className="pr-12 text-xl tracking-[0.4em] font-black h-12 text-center font-mono border-2 focus:border-accent"
                      maxLength={6}
                      placeholder="••••••"
                    />
                    <Button
                      variant="ghost" size="icon"
                      className="absolute right-2 top-1.5 hover:bg-muted"
                      onClick={() => setShowPin(v => !v)}
                    >
                      {showPin ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <Input
                    id="confirm-pin"
                    type={showPin ? "text" : "password"}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    className={cn(
                      "text-xl tracking-[0.4em] font-black h-12 text-center font-mono border-2",
                      confirmPin && confirmPin !== newPin ? "border-red-400" : "focus:border-accent"
                    )}
                    maxLength={6}
                    placeholder="••••••"
                  />
                </div>
              </div>
              {confirmPin && confirmPin !== newPin && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> PINs do not match
                </p>
              )}
              <p className="text-[10px] text-muted-foreground italic">
                Rotate PIN regularly. Use a strong, unique 6-digit code. This PIN gates emergency lockout authentication.
              </p>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-4 px-6">
              <Button
                onClick={handleSavePin}
                disabled={isSavingPin || newPin.length !== 6 || newPin !== confirmPin}
                className="w-full gap-2 h-11 font-black uppercase tracking-widest text-xs"
              >
                {isSavingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Rotate Master PIN
              </Button>
            </CardFooter>
          </Card>

          {/* Security hardening */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 border-b py-5 px-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" /> Security Hardening
              </CardTitle>
              <CardDescription>
                Session policies, multi-factor authentication, and automated log hygiene.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 space-y-1">
              {[
                {
                  key: "mfa",
                  checked: twoFactor,
                  onChange: (v: boolean) => {
                    setTwoFactor(v);
                    AuditLogger.config(`MFA ${v ? "Enabled" : "Disabled"}`, v ? "Success" : "Warning");
                    toast({ title: v ? "MFA Enabled" : "MFA Disabled" });
                  },
                  label: "Multi-Factor Authentication",
                  desc:  "Require a secondary verification step on admin login.",
                },
                {
                  key: "hijack",
                  checked: hijackProtect,
                  onChange: (v: boolean) => {
                    setHijackProtect(v);
                    AuditLogger.config(`Session Hijack Protection ${v ? "Enabled" : "Disabled"}`, v ? "Success" : "Warning");
                    toast({ title: "Session Policy Updated" });
                  },
                  label: "Session Hijack Protection",
                  desc:  "Invalidate tokens on IP or user-agent change.",
                },
                {
                  key: "rotate",
                  checked: logRotation,
                  onChange: (v: boolean) => {
                    setLogRotation(v);
                    AuditLogger.config(`Automatic Log Rotation ${v ? "Enabled" : "Disabled"}`, v ? "Success" : "Warning");
                  },
                  label: "Automatic Log Rotation",
                  desc:  "Archive logs older than 90 days automatically.",
                },
              ].map((item, idx, arr) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <Label className="font-bold cursor-pointer">{item.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
                  </div>
                  {idx < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Panic Lockout ─────────────────────────────────────────────── */}
          <div className={cn(
            "rounded-2xl border p-6 shadow-sm transition-all duration-500",
            isLockedOut
              ? "bg-red-50   border-red-200   dark:bg-red-950/30"
              : "bg-slate-50 border-slate-200 dark:bg-slate-900/30"
          )}>
            <div className="flex gap-3 items-start mb-4">
              {isLockedOut
                ? <ShieldAlert className="w-7 h-7 text-red-600 shrink-0 animate-pulse" />
                : <AlertCircle className="w-7 h-7 text-slate-500 shrink-0" />
              }
              <div>
                <p className={cn("text-sm font-black leading-tight", isLockedOut ? "text-red-900" : "text-slate-800")}>
                  {isLockedOut ? "⚠️ Panic Lockout Active" : "Emergency Panic Lockout"}
                </p>
                <p className={cn("text-[11px] leading-snug mt-1.5", isLockedOut ? "text-red-700" : "text-muted-foreground")}>
                  {isLockedOut
                    ? "All displays blacked out. Fleet output suspended. Authenticate with your Master PIN to restore system."
                    : "Immediately blackout all display endpoints fleet-wide. Requires Master PIN authentication to activate or deactivate."
                  }
                </p>
              </div>
            </div>

            {isLockedOut ? (
              <Button
                className="w-full h-11 font-black uppercase tracking-widest text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                onClick={() => { setPinChallenge(""); setChallengeError(""); setShowUnlockDialog(true); }}
              >
                <Unlock className="w-4 h-4" /> Authenticate &amp; Restore System
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full h-11 font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-red-500/20 animate-pulse hover:animate-none"
                onClick={() => { setPinChallenge(""); setChallengeError(""); setShowLockDialog(true); }}
              >
                <ShieldAlert className="w-4 h-4" /> Initiate Emergency Lockout
              </Button>
            )}
          </div>

          {/* ── Recent Audit Log (max 8) ───────────────────────────────────── */}
          <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 border-b py-4 px-5 flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent" />
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  Recent Security Log
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-black bg-white px-2">
                  Last {LOG_PREVIEW_LIMIT}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Export CSV"
                  onClick={handleExportLogs}
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-7 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary px-2 gap-1"
                  onClick={() => setIsArchiveOpen(true)}
                >
                  <Archive className="w-3 h-3" /> Archive
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 px-3 pb-3">
              {previewLogs.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-6 italic">No security events logged yet.</p>
              ) : (
                <div className="space-y-0">
                  {previewLogs.map(log => <LogRow key={log.id} log={log} compact />)}
                </div>
              )}
            </CardContent>
            {allLogs.length > LOG_PREVIEW_LIMIT && (
              <CardFooter className="border-t py-3 px-5 bg-muted/10">
                <Button
                  variant="link"
                  className="w-full h-auto p-0 text-[10px] font-black uppercase tracking-widest text-accent hover:text-primary gap-1"
                  onClick={() => setIsArchiveOpen(true)}
                >
                  View all {allLogs.length} events →
                </Button>
              </CardFooter>
            )}
          </Card>

        </div>
      </div>

      {/* ── Lockout Initiation Dialog (PIN-gated) ───────────────────────────── */}
      <Dialog open={showLockDialog} onOpenChange={v => { setShowLockDialog(v); if (!v) { setPinChallenge(""); setChallengeError(""); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-red-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-5 h-5" /> Confirm Emergency Lockout
            </DialogTitle>
            <DialogDescription>
              This will immediately blackout ALL display endpoints fleet-wide.
              You must authenticate with your Master PIN to proceed.
            </DialogDescription>
          </DialogHeader>
          <PinChallengeForm
            title="Initiate Lockout"
            subtitle="Enter your Master PIN to confirm this high-impact action."
            onConfirm={handleInitiateLock}
            destructive
          />
        </DialogContent>
      </Dialog>

      {/* ── Unlock Dialog (PIN-gated) ────────────────────────────────────────── */}
      <Dialog open={showUnlockDialog} onOpenChange={v => { setShowUnlockDialog(v); if (!v) { setPinChallenge(""); setChallengeError(""); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-emerald-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Unlock className="w-5 h-5" /> Authenticate &amp; Restore System
            </DialogTitle>
            <DialogDescription>
              Verify your identity to lift the panic lockout and restore all display output fleet-wide.
            </DialogDescription>
          </DialogHeader>
          <PinChallengeForm
            title="Restore System"
            subtitle="Enter your Master PIN to lift the emergency lockout."
            onConfirm={handleTerminateLock}
            destructive={false}
          />
        </DialogContent>
      </Dialog>

      {/* ── Full Audit Archive Dialog ────────────────────────────────────────── */}
      <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <DialogContent className="sm:max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-accent" />
              Security Audit Archive
              <Badge variant="outline" className="ml-2 text-[9px] font-black">{filteredArchiveLogs.length} entries</Badge>
            </DialogTitle>
            <DialogDescription>Complete chronological record of all security and administrative events.</DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-1">
            <Input
              placeholder="Search events or details…"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="h-9 text-sm flex-1 min-w-[160px] rounded-xl"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-36 rounded-xl text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                {(["Success","Verified","Warning","Failed","Blocked"] as LogStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 w-40 rounded-xl text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {(["auth","config","access","lockout","system"] as LogCategory[]).map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-1.5" onClick={handleExportLogs}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>

          <ScrollArea className="h-[440px] mt-2 rounded-xl border bg-muted/10 p-3">
            <div className="space-y-2">
              {filteredArchiveLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10 italic">No logs match your filters.</p>
              ) : (
                filteredArchiveLogs.map(log => <LogRow key={log.id} log={log} compact={false} />)
              )}
            </div>
          </ScrollArea>

          {/* Summary stats */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {(["Success","Verified","Warning","Failed","Blocked"] as LogStatus[]).map(s => {
              const count = filteredArchiveLogs.filter(l => l.status === s).length;
              const sc    = STATUS_CONFIG[s];
              return (
                <div key={s} className={cn("rounded-xl border text-center py-2 px-1", sc.cls)}>
                  <p className="text-sm font-black">{count}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{s}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
