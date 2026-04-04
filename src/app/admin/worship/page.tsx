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

export default function WorshipSchedules() {
  const [schedules, setSchedules] = useState<WorshipSchedule[]>(WORSHIP_SCHEDULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorshipSchedule | null>(null);
  const { toast } = useToast();

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

  const handleSave = () => {
    if (!name || !time || !location) {
      toast({ title: "Required Fields", description: "Please fill in all details.", variant: "destructive" });
      return;
    }

    if (editingSchedule) {
      setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? { ...s, name, time, location, frequency, active } : s));
      toast({ title: "Schedule Updated", description: `${name} has been updated.` });
    } else {
      const newSchedule: WorshipSchedule = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        time,
        location,
        frequency,
        active
      };
      setSchedules(prev => [...prev, newSchedule]);
      toast({ title: "Schedule Added", description: "New worship event added to rotation." });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast({ title: "Schedule Removed", description: "The event has been deleted.", variant: "destructive" });
  };

  const handleToggleActive = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Heart className="w-8 h-8 text-accent" />
            Religious Worship Schedules
          </h1>
          <p className="text-muted-foreground">Manage prayer times and religious services for digital signage display.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> Add New Event
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-96 shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search schedules or locations..." 
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
                    onCheckedChange={() => handleToggleActive(schedule.id)}
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
                {schedule.active ? "Active in Loop" : "Hidden"}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(schedule)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(schedule.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add Worship Schedule"}</DialogTitle>
            <DialogDescription>Enter details for the religious service or prayer session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Friday Jumu'ah" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. Weekly (Fri)" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location / Room</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Prayer Hall North" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Label>Show on Screens</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
