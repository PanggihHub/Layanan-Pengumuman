"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Church, 
  Plus, 
  Clock, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit,
  Heart,
  Search
} from "lucide-react";
import { WORSHIP_SCHEDULES, WorshipSchedule } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function WorshipSchedules() {
  const { t, language } = useLanguage();
  const [schedules, setSchedules] = useState<WorshipSchedule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorshipSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "worship"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorshipSchedule));
      setSchedules(items);
    });
    return () => unsub();
  }, []);

  // Form states
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState("");
  const [active, setActive] = useState(true);

  const filteredSchedules = schedules.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setName("");
    setTime("");
    setLocation("");
    setFrequency("");
    setActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (s: WorshipSchedule) => {
    setEditingSchedule(s);
    setName(s.name);
    setTime(s.time);
    setLocation(s.location);
    setFrequency(s.frequency);
    setActive(s.active);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !time || !location) {
      toast({ 
        title: language === "id-ID" ? "Bidang Wajib" : "Required Fields", 
        description: language === "id-ID" ? "Harap isi semua detail." : "Please fill in all details.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      const id = editingSchedule?.id || Math.random().toString(36).substr(2, 9);
      const newSchedule: WorshipSchedule = {
        id,
        name,
        time,
        location,
        frequency,
        active
      };

      await setDoc(doc(db, "worship", id), newSchedule);

      if (editingSchedule) {
        toast({ 
          title: language === "id-ID" ? "Jadwal Diperbarui" : "Schedule Updated", 
          description: language === "id-ID" ? `${name} telah diperbarui.` : `${name} has been updated.` 
        });
      } else {
        toast({ 
          title: language === "id-ID" ? "Jadwal Ditambahkan" : "Schedule Added", 
          description: language === "id-ID" ? "Acara ibadah baru ditambahkan ke rotasi." : "New worship event added to rotation." 
        });
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Simpan Gagal" : "Save Failed",
        description: language === "id-ID" ? "Kesalahan jaringan. Silakan coba lagi." : "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "worship", id));
      toast({ 
        title: language === "id-ID" ? "Jadwal Dihapus" : "Schedule Removed", 
        description: language === "id-ID" ? "Acara telah dihapus." : "The event has been deleted.", 
        variant: "destructive" 
      });
    } catch (e) {
      toast({
        title: language === "id-ID" ? "Hapus Gagal" : "Delete Failed",
        description: language === "id-ID" ? "Gagal menghapus jadwal." : "Failed to delete schedule.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (schedule: WorshipSchedule) => {
    try {
      await setDoc(doc(db, "worship", schedule.id), { ...schedule, active: !schedule.active });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Heart className="w-8 h-8 text-accent" />
            {t("wor.title")}
          </h1>
          <p className="text-muted-foreground">{t("wor.desc")}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> {t("wor.addEvent")}
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder={t("wor.searchPlaceholder")} 
          className="bg-transparent border-none outline-none text-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule) => (
          <Card key={schedule.id} className={schedule.active ? "border-accent/20" : "grayscale opacity-70"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Church className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={schedule.active} 
                    onCheckedChange={() => handleToggleActive(schedule)}
                  />
                </div>
              </div>
              <CardTitle className="mt-4">{schedule.name}</CardTitle>
              <CardDescription>{schedule.frequency}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-mono font-bold">{schedule.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{schedule.location}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t justify-between py-3">
              <Badge variant={schedule.active ? "default" : "outline"}>
                {schedule.active ? t("wor.activeInLoop") : t("wor.hidden")}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(schedule)} disabled={!!isDeleting}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500" 
                  onClick={() => handleDelete(schedule.id)}
                  disabled={!!isDeleting}
                >
                  {isDeleting === schedule.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? t("wor.dialogEdit") : t("wor.dialogAdd")}</DialogTitle>
            <DialogDescription>{t("wor.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("wor.eventName")}</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-11 rounded-xl"
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("wor.startTime")}</Label>
                <Input 
                  id="time" 
                  type="time"
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                  placeholder="e.g. 09:00"
                  className="h-11 rounded-xl"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wor.frequency")}</Label>
                <Input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. Weekly (Fri)" disabled={isSaving} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("wor.location")}</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Prayer Hall North" disabled={isSaving} />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Label>{t("wor.showOnScreens")}</Label>
              <Switch checked={active} onCheckedChange={setActive} disabled={isSaving} />
            </div>
          </div>
          <DialogFooter className="border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6" disabled={isSaving}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleSave} 
              className="gap-2 h-12 px-10 rounded-xl bg-accent shadow-xl shadow-accent/20 font-black uppercase tracking-tighter text-accent-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                editingSchedule ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />
              )}
              {isSaving ? (language === "id-ID" ? "Menyimpan..." : "Saving...") : (editingSchedule ? t("common.save") : t("common.add"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
