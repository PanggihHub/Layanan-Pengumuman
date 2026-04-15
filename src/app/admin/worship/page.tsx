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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Heart, Plus, Clock, MapPin, Trash2, Edit, Search,
  RefreshCw, Download, Sparkles, AlertCircle, CheckCircle2,
  Calendar, Globe, Info, Megaphone, AlertTriangle, Zap,
  ChevronUp, ChevronDown, Timer,
} from "lucide-react";
import { WorshipSchedule, TickerMessage } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, getDoc,
  query, orderBy,
} from "firebase/firestore";
import {
  fetchIslamicPrayerTimes, sortSchedulesByNextPrayer,
  getTimeUntil, ALADHAN_METHODS,
} from "@/lib/worship-importer";
import { cn } from "@/lib/utils";

const CATEGORY_COLOR: Record<string, string> = {
  islamic:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  christian: "bg-blue-100   text-blue-700   border-blue-200",
  general:   "bg-slate-100  text-slate-700  border-slate-200",
  custom:    "bg-violet-100 text-violet-700 border-violet-200",
};

export default function WorshipSchedules() {
  const { t, language } = useLanguage();
  const { toast }       = useToast();

  const [schedules, setSchedules]   = useState<WorshipSchedule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat]   = useState("all");
  const [nowMinutes, setNowMinutes] = useState(0);   // updated every minute
  const [timezone, setTimezone]     = useState("Asia/Jakarta");

  // Ticker messages state
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [newTickerMsg, setNewTickerMsg]     = useState("");
  const [newTickerPri, setNewTickerPri]     = useState<TickerMessage["priority"]>("normal");
  const [newTickerExpiry, setNewTickerExpiry] = useState("");  // datetime-local
  const [isSavingTicker, setIsSavingTicker] = useState(false);

  // Auto-import state
  const [isImportOpen, setIsImportOpen]   = useState(false);
  const [importCity, setImportCity]       = useState("");
  const [importCountry, setImportCountry] = useState("ID");
  const [importMethod, setImportMethod]   = useState(13);
  const [importLocation, setImportLocation] = useState("Masjid / Prayer Hall");
  const [isImporting, setIsImporting]     = useState(false);
  const [importPreview, setImportPreview] = useState<WorshipSchedule[]>([]);

  // Manual add / edit dialog
  const [isDialogOpen, setIsDialogOpen]       = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorshipSchedule | null>(null);
  const [isSaving, setIsSaving]               = useState(false);
  const [isDeleting, setIsDeleting]           = useState<string | null>(null);

  // Form fields
  const [name, setName]           = useState("");
  const [time, setTime]           = useState("");
  const [location, setLocation]   = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [category, setCategory]   = useState<WorshipSchedule["category"]>("islamic");
  const [active, setActive]       = useState(true);

  // ── Firestore subscription ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "worship"), (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorshipSchedule)));
    });

    // Ticker messages
    const unsubTicker = onSnapshot(
      query(collection(db, "tickerMessages"), orderBy("createdAt", "asc")),
      (snap) => setTickerMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as TickerMessage)))
    );

    // Load timezone from settings
    getDoc(doc(db, "settings", "global")).then(snap => {
      if (snap.exists() && snap.data().timezone) setTimezone(snap.data().timezone);
    });

    // Update "now" every minute for next-prayer sorting
    const updateNow = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    updateNow();
    const interval = setInterval(updateNow, 60_000);

    return () => { unsub(); unsubTicker(); clearInterval(interval); };
  }, []);

  // ── Filtered + sorted list ───────────────────────────────────────────────
  const displayedSchedules = useMemo(() => {
    let list = schedules.filter(s =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterCat === "all" || s.category === filterCat || (!s.category && filterCat === "general"))
    );
    return sortSchedulesByNextPrayer(list, nowMinutes);
  }, [schedules, searchQuery, filterCat, nowMinutes]);

  // ── Next-prayer helper ────────────────────────────────────────────────────
  const getNextPrayerIndex = () => {
    const active = displayedSchedules.filter(s => s.active);
    if (!active.length) return -1;
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const idx = active.findIndex(s => toMin(s.time) >= nowMinutes);
    return idx >= 0 ? idx : 0; // wrap
  };
  const nextPrayerIdx = getNextPrayerIndex();

  // ── Auto-import preview fetch ─────────────────────────────────────────────
  const handlePreviewImport = async () => {
    if (!importCity || !importCountry) {
      toast({ title: "Required", description: "Enter city and country code.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      const results = await fetchIslamicPrayerTimes({
        city: importCity, country: importCountry,
        method: importMethod, locationLabel: importLocation || null,
      });
      setImportPreview(results);
      toast({ title: "Preview Ready", description: `${results.length} prayer times fetched for ${importCity}.` });
    } catch (err: any) {
      toast({ title: "Fetch Failed", description: err?.message ?? "Cannot reach Aladhan API.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview.length) return;
    setIsImporting(true);
    try {
      await Promise.all(importPreview.map(s => setDoc(doc(db, "worship", s.id), s, { merge: true })));
      toast({ title: "Imported Successfully", description: `${importPreview.length} prayer times saved.` });
      setIsImportOpen(false); setImportPreview([]);
    } catch {
      toast({ title: "Save Failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  // ── Manual CRUD ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setName(""); setTime(""); setLocation(""); setFrequency("Daily");
    setCategory("general"); setActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (s: WorshipSchedule) => {
    setEditingSchedule(s);
    setName(s.name); setTime(s.time); setLocation(s.location);
    setFrequency(s.frequency); setCategory(s.category ?? "general");
    setActive(s.active);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !time || !location.trim()) {
      toast({ title: "Required Fields", description: "Name, time, and location are required.", variant: "destructive" });
      return;
    }
    // Validate HH:mm
    if (!/^\d{2}:\d{2}$/.test(time)) {
      toast({ title: "Invalid Time", description: "Use HH:mm 24-hour format.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const id = editingSchedule?.id || `manual-${Math.random().toString(36).substr(2, 9)}`;
      const payload: WorshipSchedule = {
        id, name: name.trim(), time, location: location.trim(),
        frequency, active, category, source: "manual",
      };
      await setDoc(doc(db, "worship", id), payload);
      toast({ title: editingSchedule ? "Schedule Updated" : "Schedule Added" });
      setIsDialogOpen(false);
    } catch {
      toast({ title: "Save Failed", description: "Network error.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "worship", id));
      toast({ title: "Schedule Removed", variant: "default" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    } finally { setIsDeleting(null); }
  };

  const handleToggleActive = async (s: WorshipSchedule) => {
    try {
      const sanitized = {
        ...s,
        category: s.category || "general",
        active: !s.active,
        source: s.source || "manual"
      };
      await setDoc(doc(db, "worship", s.id), sanitized);
    }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
            <Heart className="w-10 h-10 text-accent p-2 bg-accent/10 rounded-2xl" />
            {t("wor.title")}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t("wor.desc")} — sorted by next upcoming prayer · timezone: <span className="font-black text-primary">{timezone}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="gap-2 h-11 rounded-2xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
          >
            <Download className="w-4 h-4" /> Auto-Import Prayer Times
          </Button>
          <Button onClick={handleOpenAdd} className="gap-2 h-11 rounded-2xl font-bold">
            <Plus className="w-4 h-4" /> {t("wor.addEvent")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-2xl px-4 py-2.5 shadow-sm flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("wor.searchPlaceholder")}
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {["all", "islamic", "christian", "general", "custom"].map(cat => (
          <Button
            key={cat}
            size="sm"
            variant={filterCat === cat ? "default" : "outline"}
            onClick={() => setFilterCat(cat)}
            className="rounded-2xl capitalize font-bold text-xs"
          >
            {cat === "all" ? "All" : cat}
          </Button>
        ))}
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
          {displayedSchedules.filter(s => s.active).length} active · {schedules.length} total
        </span>
      </div>

      {/* Schedule grid */}
      {displayedSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <Calendar className="w-16 h-16 opacity-20" />
          <p className="italic text-sm">No schedules found. Add manually or import prayer times.</p>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2 rounded-2xl">
            <Sparkles className="w-4 h-4" /> Auto-Import from Internet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedSchedules.map((schedule, idx) => {
            const isNext = schedule.active && idx === nextPrayerIdx;
            const timeUntil = schedule.active ? getTimeUntil(schedule.time) : null;
            const catColor = CATEGORY_COLOR[schedule.category ?? "general"] ?? CATEGORY_COLOR.general;

            return (
              <Card
                key={schedule.id}
                className={cn(
                  "transition-all duration-300 rounded-2xl overflow-hidden",
                  isNext
                    ? "ring-2 ring-accent shadow-xl shadow-accent/20 scale-[1.02]"
                    : schedule.active
                    ? "border-primary/10 shadow-sm hover:shadow-md hover:scale-[1.01]"
                    : "opacity-50 grayscale",
                )}
              >
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase border", catColor)}>
                      {schedule.category ?? "general"}
                      {schedule.source === "auto" && <Globe className="w-2.5 h-2.5 ml-1" />}
                    </Badge>
                    <Switch
                      checked={schedule.active}
                      onCheckedChange={() => handleToggleActive(schedule)}
                    />
                  </div>
                  <CardTitle className="mt-3 text-lg leading-none">{schedule.name}</CardTitle>
                  <CardDescription className="text-[11px]">{schedule.frequency}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <span className="font-mono font-black text-primary text-lg">{schedule.time}</span>
                    {timeUntil && (
                      <span className={cn(
                        "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        isNext ? "bg-accent/20 text-accent-foreground border-accent/40" : "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {timeUntil === "Now" ? "🟢 NOW" : `in ${timeUntil}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">{schedule.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t justify-between py-3 px-5">
                  <Badge variant={schedule.active ? "default" : "outline"} className="text-[9px]">
                    {schedule.active ? (isNext ? "▶ NEXT" : "Active") : "Hidden"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => handleOpenEdit(schedule)}
                      disabled={!!isDeleting}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 rounded-xl text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={!!isDeleting}
                    >
                      {isDeleting === schedule.id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Ticker Manager ────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-accent" />
          <div>
            <h2 className="text-xl font-black text-primary tracking-tighter">Ticker Message Queue</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Real-time message queue — urgent → normal → info priority. Auto-expires at set time.
            </p>
          </div>
        </div>

        {/* Add new ticker message */}
        <Card className="border-primary/10 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4 px-5">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Add Message</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 px-5 space-y-4">
            <div className="space-y-2">
              <Label>Message Text</Label>
              <Input
                value={newTickerMsg}
                onChange={e => setNewTickerMsg(e.target.value)}
                placeholder="e.g. Selamat datang di ScreenSense! Ibadah Jumat pukul 12:00."
                className="h-11 rounded-xl"
                disabled={isSavingTicker}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTickerPri} onValueChange={v => setNewTickerPri(v as any)} disabled={isSavingTicker}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Urgent</div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5 text-primary" /> Normal</div>
                    </SelectItem>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2"><Info className="w-3.5 h-3.5 text-muted-foreground" /> Info</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newTickerExpiry}
                  onChange={e => setNewTickerExpiry(e.target.value)}
                  className="h-11 rounded-xl"
                  disabled={isSavingTicker}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t py-4 px-5 bg-muted/10">
            <Button
              onClick={async () => {
                if (!newTickerMsg.trim()) {
                  toast({ title: "Required", description: "Enter a message.", variant: "destructive" }); return;
                }
                setIsSavingTicker(true);
                try {
                  const id = `ticker-${Date.now()}`;
                  const payload: TickerMessage = {
                    id,
                    message: newTickerMsg.trim(),
                    priority: newTickerPri,
                    active: true,
                    createdAt: new Date().toISOString(),
                    expiresAt: newTickerExpiry ? new Date(newTickerExpiry).toISOString() : null,
                    order: tickerMessages.length,
                  };
                  await setDoc(doc(db, "tickerMessages", id), payload);
                  setNewTickerMsg(""); setNewTickerExpiry("");
                  toast({ title: "Message Added", description: `Added as "${newTickerPri}" priority.` });
                } catch {
                  toast({ title: "Failed", variant: "destructive" });
                } finally { setIsSavingTicker(false); }
              }}
              disabled={isSavingTicker || !newTickerMsg.trim()}
              className="w-full h-11 rounded-xl gap-2 font-bold"
            >
              {isSavingTicker ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Queue
            </Button>
          </CardFooter>
        </Card>

        {/* Existing ticker messages */}
        <div className="space-y-2">
          {tickerMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-10 flex flex-col items-center gap-3 text-muted-foreground">
              <Megaphone className="w-10 h-10 opacity-20" />
              <p className="text-sm italic">No ticker messages in queue. Add one above.</p>
            </div>
          ) : (
            tickerMessages.map((msg) => {
              const isExpired = msg.expiresAt && new Date(msg.expiresAt).getTime() < Date.now();
              const priColor = msg.priority === "urgent"
                ? "border-red-200 bg-red-50"
                : msg.priority === "normal"
                ? "border-primary/20 bg-primary/5"
                : "border-muted bg-muted/30";
              const priIcon = msg.priority === "urgent"
                ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                : msg.priority === "normal"
                ? <Megaphone className="w-4 h-4 text-primary shrink-0" />
                : <Info className="w-4 h-4 text-muted-foreground shrink-0" />;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
                    priColor,
                    isExpired ? "opacity-40 grayscale" : "",
                    !msg.active ? "opacity-50" : "",
                  )}
                >
                  {priIcon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{msg.message}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{msg.priority}</span>
                      {msg.expiresAt && (
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                          isExpired ? "bg-red-100 text-red-600 border-red-200" : "bg-muted text-muted-foreground border-transparent"
                        )}>
                          {isExpired ? "expired" : `expires ${new Date(msg.expiresAt).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={msg.active && !isExpired}
                    onCheckedChange={async v => {
                      await setDoc(doc(db, "tickerMessages", msg.id), { ...msg, active: v }, { merge: true });
                    }}
                    disabled={!!isExpired}
                  />
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 rounded-xl text-red-500 hover:bg-red-50"
                    onClick={async () => {
                      await deleteDoc(doc(db, "tickerMessages", msg.id));
                      toast({ title: "Message Removed" });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Auto-Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={v => { setIsImportOpen(v); if (!v) setImportPreview([]); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Auto-Import Islamic Prayer Times
            </DialogTitle>
            <DialogDescription>
              Fetches live prayer times from <strong>Aladhan API</strong> for any city.
              Imported times replace previous auto entries (manual ones are untouched).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={importCity}
                  onChange={e => setImportCity(e.target.value)}
                  placeholder="e.g. Yogyakarta"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Country Code</Label>
                <Input
                  value={importCountry}
                  onChange={e => setImportCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. ID"
                  maxLength={2}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Calculation Method</Label>
              <Select value={String(importMethod)} onValueChange={v => setImportMethod(Number(v))}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl max-h-56 overflow-y-auto">
                  {ALADHAN_METHODS.map(m => (
                    <SelectItem key={m.id} value={String(m.id)} className="text-xs">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Location Label</Label>
              <Input
                value={importLocation}
                onChange={e => setImportLocation(e.target.value)}
                placeholder="e.g. Aula Masjid Lt. 1"
                className="h-11 rounded-xl"
              />
            </div>

            <Button
              onClick={handlePreviewImport}
              disabled={isImporting || !importCity || !importCountry}
              className="w-full h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isImporting ? "Fetching…" : "Fetch Preview"}
            </Button>

            {importPreview.length > 0 && (
              <div className="rounded-xl border bg-muted/20 divide-y overflow-hidden">
                {importPreview.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-primary w-28">{p.name}</span>
                      <span className="font-mono text-accent font-bold">{p.time}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleConfirmImport}
              disabled={!importPreview.length || isImporting}
              className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save {importPreview.length} Prayer Times
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manual Add/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? t("wor.dialogEdit") : t("wor.dialogAdd")}</DialogTitle>
            <DialogDescription>{t("wor.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t("wor.eventName")}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>{t("wor.startTime")} (HH:mm)</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-11 rounded-xl" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category || "general"} onValueChange={v => setCategory(v as any)} disabled={isSaving}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="islamic">Islamic</SelectItem>
                    <SelectItem value="christian">Christian</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("wor.location")}</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Prayer Hall North" className="h-11 rounded-xl" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t("wor.frequency")}</Label>
              <Select value={frequency} onValueChange={setFrequency} disabled={isSaving}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly (Sun)">Weekly (Sunday)</SelectItem>
                  <SelectItem value="Weekly (Fri)">Weekly (Friday)</SelectItem>
                  <SelectItem value="Weekly (Sat)">Weekly (Saturday)</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Special">Special / Once</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Label>{t("wor.showOnScreens")}</Label>
              <Switch checked={active} onCheckedChange={setActive} disabled={isSaving} />
            </div>
          </div>
          <DialogFooter className="border-t pt-5 gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6" disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} className="gap-2 h-11 px-10 rounded-xl" disabled={isSaving}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : editingSchedule ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isSaving ? "Saving…" : editingSchedule ? t("common.save") : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
