"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, Filter, Grid2X2, List, Trash2, Edit3, MoreVertical,
  PlayCircle, X, Upload, Globe, HardDrive, Info, Scissors,
  CheckCircle2, FileVideo, Clock, CloudSun, RefreshCw, Maximize2, Radio,
  Zap, Film, Cpu, Wifi, ShieldAlert, Eye, EyeOff, Activity
} from "lucide-react";
import Image from "next/image";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn, extractYouTubeId, getMediaThumbnail } from "@/lib/utils";

import { INITIAL_MEDIA, MediaItem, MediaType, VideoClass } from "@/lib/mock-data";
import {
  buildPipelineConfig,
  classifyByQualityLabel,
  classifyByResolution,
  getDeviceCapacity,
  getVideoClassBadge,
  youTubeVqParam,
  PipelineConfig,
  deriveQualityLabel,
} from "@/lib/media-pipeline";
import { AdaptiveVideoPlayer } from "@/components/ui/adaptive-video-player";

import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useLanguage } from "@/context/LanguageContext";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: VideoClassBadge
// ─────────────────────────────────────────────────────────────────────────────

function VideoClassBadge({ videoClass, compact = false }: { videoClass?: VideoClass | null; compact?: boolean }) {
  const info = getVideoClassBadge(videoClass);
  const IconMap: Record<string, React.ElementType> = {
    film: Film, zap: Zap, cpu: Cpu,
  };
  const Icon = IconMap[info.icon] || Cpu;
  return (
    <Badge
      title={info.tooltip}
      className={cn(
        "gap-1 border font-black uppercase tracking-widest",
        info.bgColor, info.color,
        compact ? "text-[8px] px-1.5 py-0" : "text-[9px] px-2 py-0.5"
      )}
    >
      <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {compact ? info.label.replace(' ', '\u00A0') : info.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: MediaThumbnail (lazy, with class badge overlay)
// ─────────────────────────────────────────────────────────────────────────────

function MediaThumbnail({ media }: { media: MediaItem }) {
  const [imgErr, setImgErr] = useState(false);

  if (media.type === 'clock') return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white">
      <Clock className="w-10 h-10 mb-2 text-primary" />
      <span className="text-[9px] font-black tracking-widest uppercase">System Clock</span>
    </div>
  );

  if (media.type === 'weather') return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-900 text-white">
      <CloudSun className="w-10 h-10 mb-2 text-accent" />
      <span className="text-[9px] font-black tracking-widest uppercase">Weather Widget</span>
    </div>
  );

  if (imgErr) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 gap-2">
      <ShieldAlert className="w-8 h-8 text-zinc-500" />
      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Source Unavailable</span>
    </div>
  );

  return (
    <Image
      src={getMediaThumbnail(media.url, media.type)}
      alt={media.name}
      fill
      className="object-cover"
      loading="lazy"
      unoptimized
      onError={() => setImgErr(true)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: PipelineTelemetryPanel
// ─────────────────────────────────────────────────────────────────────────────

function PipelineTelemetryPanel({ config }: { config: PipelineConfig | null }) {
  const device = useMemo(() => getDeviceCapacity(), []);
  if (!config) return null;
  const badge = getVideoClassBadge(config.videoClass);
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5 space-y-3 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-black uppercase tracking-[0.2em] text-primary/60">Pipeline Telemetry</span>
        <Badge className={cn("border gap-1", badge.bgColor, badge.color, "text-[8px] font-black uppercase tracking-widest")}>
          {config.videoClass === 'motion_video' ? <Film className="w-3 h-3" /> :
           config.videoClass === 'hd_stream'    ? <Zap  className="w-3 h-3" /> :
                                                  <Cpu  className="w-3 h-3" />}
          {badge.label}
        </Badge>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-medium">
        <div className="text-muted-foreground">Class</div>
        <div className="font-black text-primary truncate">{badge.label}</div>

        <div className="text-muted-foreground">Quality</div>
        <div className="font-black text-primary">{config.qualityLabel}</div>

        <div className="text-muted-foreground">Target Bitrate</div>
        <div className="font-black text-primary">
          {config.targetBitrateKbps >= 1000
            ? `${(config.targetBitrateKbps / 1000).toFixed(1)} Mbps`
            : `${config.targetBitrateKbps} kbps`}
        </div>

        <div className="text-muted-foreground">Resolution</div>
        <div className="font-black text-primary">
          {config.resolutionWidth > 0
            ? `${config.resolutionWidth}×${config.resolutionHeight}`
            : 'Auto-detect'}
        </div>

        <div className="text-muted-foreground">Buffer</div>
        <div className="font-black text-primary">{config.bufferSizeSeconds}s</div>

        <div className="text-muted-foreground">Lazy Load</div>
        <div className="font-black text-primary">{config.lazyLoad ? 'Yes' : 'No'}</div>

        <div className="text-muted-foreground">Adaptive Stream</div>
        <div className="font-black text-primary">{config.useAdaptiveStream ? 'Active' : 'Direct'}</div>

        <div className="text-muted-foreground">Codec Chain</div>
        <div className="font-mono text-primary truncate text-[9px]">{config.codecHint}</div>

        <div className="text-muted-foreground">Device Cores</div>
        <div className="font-black text-primary">{device.cpuCores} vCPU</div>

        <div className="text-muted-foreground">Device Memory</div>
        <div className="font-black text-primary">{device.deviceMemoryGB} GB</div>

        <div className="text-muted-foreground">Connection</div>
        <div className="font-black text-primary uppercase">{device.connectionType}</div>

        <div className="text-muted-foreground">4K Capable</div>
        <div className={cn("font-black", device.supports4K ? "text-emerald-600" : "text-amber-600")}>
          {device.supports4K ? 'Yes ✓' : 'No (downgraded)'}
        </div>
      </div>
      <p className="italic text-muted-foreground/60 leading-relaxed pt-1">{badge.tooltip}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MediaLibrary() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [classFilter, setClassFilter] = useState<VideoClass | "all">("all");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Dialog
  const [isDialogOpen, setIsDialogOpen]        = useState(false);
  const [dialogMode, setDialogMode]            = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem]          = useState<MediaItem | null>(null);
  const [selectedFile, setSelectedFile]         = useState<File | null>(null);
  const [uploadProgress, setUploadProgress]    = useState(0);
  const [previewConfig, setPreviewConfig]      = useState<PipelineConfig | null>(null);

  // Form state
  const [sourceOrigin, setSourceOrigin]        = useState<"internal" | "external">("internal");
  const [newName, setNewName]                  = useState("");
  const [newTitle, setNewTitle]                = useState("");
  const [newContent, setNewContent]            = useState("");
  const [newDescription, setNewDescription]    = useState("");
  const [newType, setNewType]                  = useState<MediaType>("image");
  const [newUrl, setNewUrl]                    = useState("");
  const [startTime, setStartTime]              = useState<number>(0);
  const [endTime, setEndTime]                  = useState<number>(30);
  const [validFrom, setValidFrom]              = useState("");
  const [validUntil, setValidUntil]            = useState("");
  const [priority, setPriority]                = useState<number>(1);
  const [videoQuality, setVideoQuality]        = useState<string>("auto");
  const [videoClass, setVideoClass]            = useState<VideoClass>("adaptive");
  const [resW, setResW]                        = useState<number>(0);
  const [resH, setResH]                        = useState<number>(0);
  const [enableLazy, setEnableLazy]            = useState(true);
  const [enableDynBuf, setEnableDynBuf]        = useState(true);

  const [isUploading, setIsUploading]          = useState(false);
  const [isSourceConfirmed, setIsSourceConfirmed] = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [isDeleting, setIsDeleting]            = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry]      = useState(false);

  // ── Auto-derive pipeline class whenever quality / resolution changes ──────
  const derivedPipelineConfig = useMemo(() => {
    if (newType !== 'video' && newType !== 'external_video') return null;
    const fakeItem: MediaItem = {
      id: '__preview__', name: newName, type: newType, source: sourceOrigin,
      size: '', date: '', url: newUrl, category: 'campus',
      quality: videoQuality,
      videoClass,
      resolutionWidth: resW,
      resolutionHeight: resH,
      lazyLoad: enableLazy,
      dynamicBuffer: enableDynBuf,
    };
    const device = getDeviceCapacity();
    return buildPipelineConfig(fakeItem, device);
  }, [newType, videoQuality, videoClass, resW, resH, enableLazy, enableDynBuf, newName, newUrl, sourceOrigin]);

  // Keep previewConfig in sync
  useEffect(() => {
    setPreviewConfig(derivedPipelineConfig);
  }, [derivedPipelineConfig]);

  // Auto-set videoClass when quality changes
  useEffect(() => {
    if (videoQuality === 'auto' || videoQuality === 'adaptive') {
      setVideoClass('adaptive');
    } else {
      const { videoClass: vc } = classifyByQualityLabel(videoQuality);
      setVideoClass(vc);
    }
  }, [videoQuality]);

  // Auto-set videoClass when resolution changes
  useEffect(() => {
    if (resW > 0 && resH > 0) {
      setVideoClass(classifyByResolution(resW, resH));
    }
  }, [resW, resH]);

  // ── Firestore real-time sync ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "media"), (snapshot) => {
      if (snapshot.empty && INITIAL_MEDIA.length > 0) {
        INITIAL_MEDIA.forEach(async (item) => {
          await setDoc(doc(db, "media", item.id), item);
        });
      } else {
        setMediaItems(
          snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MediaItem))
        );
      }
    });
    return () => unsub();
  }, []);

  // ── Filtered + sorted media ───────────────────────────────────────────────
  const filteredMedia = useMemo(() => {
    const now = new Date();
    return mediaItems
      .filter(item => {
        const q = searchQuery.toLowerCase();
        const matchSearch  = item.name.toLowerCase().includes(q) ||
                             item.title?.toLowerCase().includes(q) ||
                             item.description?.toLowerCase().includes(q);
        const matchType    = !filterType || item.type === filterType;
        const isScheduled  = item.validFrom  && new Date(item.validFrom)  > now;
        const isExpired    = item.validUntil && new Date(item.validUntil) < now;
        const isActive     = !isScheduled && !isExpired;
        const matchStatus  =
          statusFilter === "active"    ? isActive :
          statusFilter === "scheduled" ? !!isScheduled :
          statusFilter === "expired"   ? !!isExpired : true;
        const matchClass   =
          classFilter === "all" ? true :
          (item.type === 'video' || item.type === 'external_video')
            ? (item.videoClass ?? 'adaptive') === classFilter
            : false;

        return matchSearch && matchType && matchStatus && matchClass;
      })
      .sort((a, b) => {
        const pA = a.priority ?? 999;
        const pB = b.priority ?? 999;
        if (pA !== pB) return pA - pB;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [mediaItems, searchQuery, filterType, statusFilter, classFilter]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (item: MediaItem) => {
    if (isDeleting) return;
    setIsDeleting(item.id);
    try {
      if (item.source === 'internal' && item.url.includes("firebasestorage")) {
        await deleteObject(ref(storage, item.url));
      }
      await deleteDoc(doc(db, "media", item.id));
      toast({ title: language === "id-ID" ? "Aset Dihapus" : "Asset Removed", description: item.name });
    } catch (err) {
      console.error("Delete failed", err);
      toast({ title: "Error", variant: "destructive", description: "Could not remove asset" });
    } finally {
      setIsDeleting(null);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveMedia = async () => {
    if (!newName) {
      toast({ title: "Title Required", variant: "destructive" }); return;
    }
    if (sourceOrigin === 'external' && !newUrl) {
      toast({ title: "URL Required", variant: "destructive" }); return;
    }
    if (sourceOrigin === 'internal' && !isSourceConfirmed && dialogMode === "add") {
      toast({ title: "Source Required", variant: "destructive" }); return;
    }
    const MAX_DURATION = 600;
    if ((newType === 'video' || newType === 'external_video') && (endTime - startTime) > MAX_DURATION) {
      toast({ title: "Clip Too Long", description: `Max ${MAX_DURATION}s`, variant: "destructive" }); return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    let finalUrl  = newUrl;
    let finalSize = sourceOrigin === 'internal' ? "Pending" : "Stream";

    try {
      if (sourceOrigin === 'internal' && selectedFile) {
        finalSize = `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;
        const fileRef   = ref(storage, `media/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);
        
        await new Promise<void>((res, rej) => {
          uploadTask.on("state_changed",
            s => setUploadProgress((s.bytesTransferred / s.totalBytes) * 100),
            rej,
            async () => { 
              finalUrl = await getDownloadURL(uploadTask.snapshot.ref); 
              res(); 
            }
          );
        });
      }

      // Resolve final pipeline class
      const finalClass: VideoClass =
        (resW > 0 && resH > 0)
          ? classifyByResolution(resW, resH)
          : videoClass;

      const baseItem: any = {
        name: newName,
        title: newTitle || null,
        content: newContent || null,
        description: newDescription || null,
        type: newType,
        source: sourceOrigin,
        size: finalSize,
        date: new Date().toISOString().split('T')[0],
        validFrom: validFrom || null,
        validUntil: validUntil || null,
        priority: priority || 1,
        url: finalUrl,
        category: 'campus',
      };

      if (newType === 'video' || newType === 'external_video') {
        baseItem.startTime        = startTime;
        baseItem.endTime          = endTime;
        baseItem.quality          = videoQuality || "auto";
        baseItem.videoClass       = finalClass || "adaptive";
        baseItem.resolutionWidth  = resW || null;
        baseItem.resolutionHeight = resH || null;
        baseItem.lazyLoad         = enableLazy ?? true;
        baseItem.dynamicBuffer    = enableDynBuf ?? true;
        
        // Compute bitrate from pipeline config
        const cfg = buildPipelineConfig({ ...baseItem, id: '__temp__' }, getDeviceCapacity());
        baseItem.bitrateKbps      = cfg.targetBitrateKbps || null;
        baseItem.codecHint        = cfg.codecHint || null;
      }

      if (dialogMode === "add") {
        const newId = Math.random().toString(36).substr(2, 9);
        const newItem = { ...baseItem, id: newId };
        await setDoc(doc(db, "media", newId), newItem);
        toast({ title: language === "id-ID" ? "Media Dibuat" : "Media Created", description: newName });
      } else if (currentItem) {
        const updated = { ...currentItem, ...baseItem };
        await setDoc(doc(db, "media", currentItem.id), updated);
        toast({ title: language === "id-ID" ? "Media Diperbarui" : "Media Updated" });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save failed", err);
      toast({ title: "Error", variant: "destructive", description: "Failed to save media changes" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewName(""); setNewTitle(""); setNewContent(""); setValidFrom("");
    setValidUntil(""); setPriority(1); setNewDescription(""); setNewUrl("");
    setNewType("image"); setSourceOrigin("internal"); setStartTime(0);
    setEndTime(30); setVideoQuality("auto"); setVideoClass("adaptive");
    setResW(0); setResH(0); setEnableLazy(true); setEnableDynBuf(true);
    setCurrentItem(null); setSelectedFile(null); setUploadProgress(0);
    setIsUploading(false); setIsSourceConfirmed(false); setPreviewConfig(null);
  };

  const openAddDialog = () => { setDialogMode("add"); resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (item: MediaItem) => {
    setDialogMode("edit"); setCurrentItem(item);
    setNewName(item.name); setNewTitle(item.title || "");
    setNewContent(item.content || ""); setValidFrom(item.validFrom || "");
    setValidUntil(item.validUntil || ""); setPriority(item.priority || 1);
    setNewDescription(item.description || ""); setNewUrl(item.url);
    setNewType(item.type); setSourceOrigin(item.source);
    setStartTime(item.startTime || 0); setEndTime(item.endTime || 30);
    setVideoQuality((item as any).quality || "auto");
    setVideoClass(item.videoClass || "adaptive");
    setResW(item.resolutionWidth || 0); setResH(item.resolutionHeight || 0);
    setEnableLazy(item.lazyLoad ?? true); setEnableDynBuf(item.dynamicBuffer ?? true);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setIsSourceConfirmed(false); setSelectedFile(null); return; }
    setSelectedFile(file);
    setIsUploading(true);
    setNewName(file.name.split('.')[0]);
    if (file.type.startsWith('video/')) setNewType('video');
    else if (file.type.startsWith('image/')) setNewType('image');

    // Create object URL for preview + probe resolution
    const objUrl = URL.createObjectURL(file);
    setNewUrl(objUrl);

    if (file.type.startsWith('video/')) {
      const tempVideo = document.createElement('video');
      tempVideo.src   = objUrl;
      tempVideo.addEventListener('loadedmetadata', () => {
        const w = tempVideo.videoWidth;
        const h = tempVideo.videoHeight;
        if (w > 0 && h > 0) {
          setResW(w); setResH(h);
          setVideoClass(classifyByResolution(w, h));
          const q = deriveQualityLabel(w, h, classifyByResolution(w, h), '1080p');
          setVideoQuality(q);
        }
        setIsUploading(false);
        setIsSourceConfirmed(true);
        toast({ title: "Source Staged", description: `${file.name} — ${w}×${h}px detected.` });
      });
      tempVideo.addEventListener('error', () => {
        setIsUploading(false); setIsSourceConfirmed(true);
        toast({ title: "Source Staged", description: file.name });
      });
    } else {
      setTimeout(() => {
        setIsUploading(false); setIsSourceConfirmed(true);
        toast({ title: "Source Staged", description: file.name });
      }, 800);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusBadge = (item: MediaItem) => {
    const now = new Date();
    if (item.validUntil && new Date(item.validUntil) < now)
      return <Badge className="text-[8px] font-black px-1.5 py-0 border bg-red-50 text-red-600 border-red-200">EXPIRED</Badge>;
    if (item.validFrom && new Date(item.validFrom) > now)
      return <Badge className="text-[8px] font-black px-1.5 py-0 border bg-amber-50 text-amber-600 border-amber-200">SCHEDULED</Badge>;
    return <Badge className="text-[8px] font-black px-1.5 py-0 border bg-emerald-50 text-emerald-600 border-emerald-200">ACTIVE</Badge>;
  };

  const isVideo = newType === 'video' || newType === 'external_video';

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t("med.title")}</h1>
          <p className="text-muted-foreground">{t("med.desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2 h-10 rounded-xl px-4", showTelemetry && "bg-primary/5 border-primary text-primary")}
            onClick={() => setShowTelemetry(p => !p)}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pipeline HUD</span>
          </Button>
          <Button onClick={openAddDialog} className="bg-primary gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> {t("med.addSource")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/50 border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 w-full md:w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("med.searchPlaceholder")}
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-muted-foreground hover:text-primary" /></button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-10 rounded-xl px-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {statusFilter === "all" ? "All Status" :
                       statusFilter === "active" ? "Active" :
                       statusFilter === "scheduled" ? "Scheduled" : "Expired"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl p-2 w-48 bg-white/95 backdrop-blur-xl border-none shadow-2xl">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")} className="rounded-lg text-[10px] font-black uppercase tracking-widest">All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")} className="rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("scheduled")} className="rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-600">Scheduled</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("expired")} className="rounded-lg text-[10px] font-black uppercase tracking-widest text-red-600">Expired</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-10 rounded-xl px-4">
                    <Filter className="w-4 h-4" />
                    {filterType ? filterType.replace('_', ' ').toUpperCase() : "All Formats"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl p-2">
                  <DropdownMenuItem onClick={() => setFilterType(null)} className="rounded-lg">All Formats</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("image")} className="rounded-lg">Still Images</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("video")} className="rounded-lg">Motion Video (≤FHD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("external_video")} className="rounded-lg">HD Stream (&gt;FHD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("website")} className="rounded-lg">Dashboard / Website</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Video Class filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-10 rounded-xl px-4">
                    <Zap className="w-4 h-4 text-violet-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {classFilter === "all" ? "All Classes" :
                       classFilter === "motion_video" ? "Motion Video" :
                       classFilter === "hd_stream" ? "HD Stream" : "Adaptive"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl p-2 w-52">
                  <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2">Pipeline Class</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setClassFilter("all")} className="rounded-lg">All Classes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setClassFilter("motion_video")} className="rounded-lg text-emerald-700">
                    <Film className="w-3.5 h-3.5 mr-2" /> Motion Video (≤1080p)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setClassFilter("hd_stream")} className="rounded-lg text-violet-700">
                    <Zap className="w-3.5 h-3.5 mr-2" /> HD Stream (&gt;1080p)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setClassFilter("adaptive")} className="rounded-lg text-sky-700">
                    <Cpu className="w-3.5 h-3.5 mr-2" /> Adaptive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View toggle */}
              <div className="border rounded-xl flex p-1 bg-white shadow-sm">
                <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")} className="h-8 w-8 rounded-lg">
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setView("list")} className="h-8 w-8 rounded-lg">
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white/50 rounded-3xl border-2 border-dashed border-primary/10">
          <Search className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xl font-black text-primary/30 uppercase tracking-widest">No Matching Assets</p>
          <Button variant="link" onClick={() => { setSearchQuery(""); setFilterType(null); setClassFilter("all"); }} className="text-accent mt-2">Clear Filters</Button>
        </div>
      ) : view === "grid" ? (
        /* ── Grid View ─────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map(media => (
            <Card key={media.id} className="group overflow-hidden hover:ring-2 hover:ring-accent transition-all flex flex-col rounded-2xl border-primary/5 shadow-sm">
              <div className="relative aspect-video bg-muted shrink-0">
                <MediaThumbnail media={media} />

                {/* Play overlay for video */}
                {(media.type === "video" || media.type === "external_video") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <PlayCircle className="w-10 h-10 text-white/80" />
                  </div>
                )}

                {/* Actions menu */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2">
                      <DropdownMenuItem onClick={() => openEditDialog(media)} className="rounded-lg">
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(media)} className="text-red-600 rounded-lg" disabled={!!isDeleting}>
                        {isDeleting === media.id ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Source badge */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {media.source === 'external' ? (
                    <Badge className="bg-blue-600/80 backdrop-blur-sm gap-1 border-none rounded-md px-2 py-0.5 text-[10px]">
                      <Globe className="w-3 h-3" /> Ext
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600/80 backdrop-blur-sm gap-1 border-none rounded-md px-2 py-0.5 text-[10px]">
                      <HardDrive className="w-3 h-3" /> Int
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm truncate text-primary/80 uppercase tracking-tight">{media.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{media.size} · {media.date}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge variant="outline" className="capitalize text-[9px] font-black tracking-[0.1em] px-1.5 py-0 bg-white">
                      {media.type}
                    </Badge>
                    {getStatusBadge(media)}
                  </div>
                </div>

                {/* Video class badge */}
                {(media.type === 'video' || media.type === 'external_video') && (
                  <VideoClassBadge videoClass={media.videoClass} compact />
                )}

                {/* Clip info */}
                {media.type === 'video' && media.startTime !== undefined && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-accent uppercase tracking-[0.1em] mt-1 bg-accent/10 px-2 py-1 rounded-lg w-fit">
                    <Scissors className="w-3 h-3" /> {media.startTime}s → {media.endTime}s
                  </div>
                )}

                {/* Live telemetry */}
                {showTelemetry && (media.type === 'video' || media.type === 'external_video') && (() => {
                  const cfg = buildPipelineConfig(media, getDeviceCapacity());
                  return (
                    <div className="mt-2 pt-2 border-t border-dashed border-primary/10 space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase">
                        <span>Quality</span><span className="text-primary">{cfg.qualityLabel}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase">
                        <span>Bitrate</span><span className="text-primary">
                          {cfg.targetBitrateKbps >= 1000 ? `${(cfg.targetBitrateKbps / 1000).toFixed(1)}M` : `${cfg.targetBitrateKbps}k`}bps
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase">
                        <span>Stream</span><span className={cfg.useAdaptiveStream ? "text-violet-600" : "text-emerald-600"}>
                          {cfg.useAdaptiveStream ? "ABR" : "Direct"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {media.description && (
                  <div className="flex gap-1.5 items-start mt-1">
                    <Info className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight italic">{media.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────────────── */
        <Card className="rounded-2xl overflow-hidden border-primary/5 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Preview</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Name</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Class / Quality</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Publication</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Source</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-left">Storage</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map(media => (
                  <tr key={media.id} className="border-b hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-14 h-9 rounded-lg relative overflow-hidden bg-muted border">
                        <MediaThumbnail media={media} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-primary/70 uppercase tracking-tight text-xs">{media.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px] mt-0.5">{media.description || "No metadata"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(media.type === 'video' || media.type === 'external_video') ? (
                        <div className="flex flex-col gap-1">
                          <VideoClassBadge videoClass={media.videoClass} compact />
                          {(() => {
                            const cfg = buildPipelineConfig(media, getDeviceCapacity());
                            return (
                              <span className="text-[9px] font-black text-muted-foreground uppercase">
                                {cfg.qualityLabel} · {cfg.useAdaptiveStream ? 'ABR' : 'Direct'}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <Badge variant="outline" className="capitalize text-[9px] font-black px-1.5 py-0">{media.type}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{media.date}</span>
                        {getStatusBadge(media)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {media.source === 'external' ? (
                        <Badge variant="secondary" className="text-blue-600 bg-blue-50 border-blue-100 gap-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <Globe className="w-3 h-3" /> External
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 border-emerald-100 gap-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <HardDrive className="w-3 h-3" /> Internal
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{media.size}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(media)} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                          <Edit3 className="w-4 h-4 text-primary/70" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(media)} className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600" disabled={!!isDeleting}>
                          {isDeleting === media.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {dialogMode === "add" ? t("med.stageNew") : t("med.modifyProfile")}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? t("med.dialogAddDesc") : t("med.dialogEditDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 py-4">
            {/* ── Form Side ──────────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Source origin tabs */}
              <Tabs value={sourceOrigin} onValueChange={(v: any) => setSourceOrigin(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-muted/50 p-1">
                  <TabsTrigger value="internal" className="text-xs font-bold rounded-lg" disabled={isSaving}>Cloud Storage</TabsTrigger>
                  <TabsTrigger value="external" className="text-xs font-bold rounded-lg" disabled={isSaving}>External Feed</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Name + Title */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Asset ID / Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Orientation_Loop" className="h-11 rounded-xl" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Display Title</Label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Optional on-screen title" className="h-11 rounded-xl" disabled={isSaving} />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Detail Content</Label>
                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Extended content / body text" className="rounded-xl resize-none" rows={2} disabled={isSaving} />
              </div>

              {/* Validity + Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Valid From</Label>
                  <Input type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="h-11 rounded-xl" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Valid Until</Label>
                  <Input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="h-11 rounded-xl" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Priority</Label>
                  <Input type="number" min="1" max="10" value={priority} onChange={e => setPriority(Number(e.target.value))} className="h-11 rounded-xl" disabled={isSaving} />
                </div>
              </div>

              {/* Media type */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Media Class</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)} disabled={isSaving}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-2">
                    <SelectItem value="image" className="rounded-lg">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Still Image</div>
                    </SelectItem>
                    <SelectItem value="video" className="rounded-lg">
                      <div className="flex items-center gap-2"><Film className="w-3.5 h-3.5 text-emerald-600" /> Motion Video (≤1080p FHD)</div>
                    </SelectItem>
                    <SelectItem value="external_video" className="rounded-lg">
                      <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-violet-600" /> HD Stream (&gt;1080p · ABR)</div>
                    </SelectItem>
                    <SelectItem value="website" className="rounded-lg">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Dashboard / Website</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Video-specific: pipeline settings */}
              {isVideo && (
                <div className="space-y-5 pt-4 border-t border-dashed border-primary/20">
                  <div className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Adaptive Pipeline Settings
                  </div>

                  {/* Quality + Resolution */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quality Target</Label>
                      <Select value={videoQuality} onValueChange={setVideoQuality} disabled={isSaving}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl p-2">
                          <SelectItem value="auto" className="rounded-lg">Auto / Adaptive (ABR)</SelectItem>
                          <SelectItem value="480p" className="rounded-lg">480p SD</SelectItem>
                          <SelectItem value="720p" className="rounded-lg"><Film className="w-3 h-3 mr-1 inline text-emerald-600" />720p HD</SelectItem>
                          <SelectItem value="1080p" className="rounded-lg"><Film className="w-3 h-3 mr-1 inline text-emerald-600" />1080p FHD (Motion Video)</SelectItem>
                          <SelectItem value="4K" className="rounded-lg"><Zap className="w-3 h-3 mr-1 inline text-violet-600" />4K UHD (HD Stream)</SelectItem>
                          <SelectItem value="8K" className="rounded-lg"><Zap className="w-3 h-3 mr-1 inline text-violet-600" />8K (HD Stream)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Declared Resolution</Label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="W" value={resW || ""} onChange={e => setResW(Number(e.target.value))} className="h-11 rounded-xl" disabled={isSaving} />
                        <Input type="number" placeholder="H" value={resH || ""} onChange={e => setResH(Number(e.target.value))} className="h-11 rounded-xl" disabled={isSaving} />
                      </div>
                    </div>
                  </div>

                  {/* Derived class display */}
                  {previewConfig && (
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border",
                      previewConfig.videoClass === 'hd_stream'    ? 'bg-violet-50 border-violet-200' :
                      previewConfig.videoClass === 'motion_video'  ? 'bg-emerald-50 border-emerald-200' :
                                                                     'bg-sky-50 border-sky-100'
                    )}>
                      {previewConfig.videoClass === 'hd_stream' ? <Zap className="w-5 h-5 text-violet-600 shrink-0" /> :
                       previewConfig.videoClass === 'motion_video' ? <Film className="w-5 h-5 text-emerald-600 shrink-0" /> :
                       <Cpu className="w-5 h-5 text-sky-600 shrink-0" />}
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-widest",
                          previewConfig.videoClass === 'hd_stream' ? 'text-violet-700' :
                          previewConfig.videoClass === 'motion_video' ? 'text-emerald-700' : 'text-sky-700'
                        )}>
                          {getVideoClassBadge(previewConfig.videoClass).label} · {previewConfig.qualityLabel}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {previewConfig.targetBitrateKbps >= 1000
                            ? `${(previewConfig.targetBitrateKbps / 1000).toFixed(1)} Mbps`
                            : `${previewConfig.targetBitrateKbps} kbps`} target ·{" "}
                          {previewConfig.useAdaptiveStream ? 'Adaptive Transcode (ABR)' : 'Direct Play'}
                          {" · "}Buffer: {previewConfig.bufferSizeSeconds}s
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lazy Load + Dynamic Buffer toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Lazy Loading", desc: "Defer load until near viewport", val: enableLazy, set: setEnableLazy },
                      { label: "Dynamic Buffer", desc: "Adapts buffer to network speed", val: enableDynBuf, set: setEnableDynBuf },
                    ].map(({ label, desc, val, set }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set(!val)}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all",
                          val ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-muted opacity-60"
                        )}
                        disabled={isSaving}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                          <div className={cn("w-8 h-4 rounded-full transition-colors flex items-center px-0.5", val ? "bg-primary" : "bg-zinc-300")}>
                            <div className={cn("w-3 h-3 bg-white rounded-full shadow transition-transform", val ? "translate-x-4" : "")} />
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground">{desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Timeline clip */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
                      <Scissors className="w-4 h-4" /> Timeline Clip (Seconds)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Mark In (s)</Label>
                        <Input type="number" value={startTime} onChange={e => setStartTime(Number(e.target.value))} className="h-10 rounded-xl" disabled={isSaving} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Mark Out (s)</Label>
                        <Input type="number" value={endTime} onChange={e => setEndTime(Number(e.target.value))} className="h-10 rounded-xl" disabled={isSaving} />
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full relative overflow-hidden border">
                      <div
                        className="absolute bg-primary/30 h-full border-x border-primary"
                        style={{ left: `${(startTime / Math.max(endTime + 60, 120)) * 100}%`, width: `${((endTime - startTime) / Math.max(endTime + 60, 120)) * 100}%` }}
                      />
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-dashed text-[10px] text-zinc-500 italic">
                      Scene duration: <span className="font-bold text-primary">{endTime - startTime}s</span> · Max {newType === 'external_video' ? '600s (10 min)' : 'unlimited'}
                    </div>
                  </div>
                </div>
              )}

              {/* Source input */}
              {sourceOrigin === "external" ? (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Source URL</Label>
                  <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="h-11 rounded-xl font-mono text-xs" disabled={isSaving} />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Upload File</Label>
                  <div
                    className="w-full h-32 border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Analysing…</span>
                      </div>
                    ) : isSourceConfirmed ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-emerald-100 rounded-full"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Source Ready</span>
                        {resW > 0 && (
                          <span className="text-[9px] text-muted-foreground font-mono">{resW}×{resH}px detected</span>
                        )}
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setIsSourceConfirmed(false); fileInputRef.current?.click(); }} className="h-6 text-[9px] font-bold">
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center px-4">
                          Click to Browse File<br />
                          <span className="lowercase font-normal opacity-60">mp4, webm, mov, jpg, png, gif…</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Metadata / Notes</Label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Optional notes, tags, or context" className="h-20 rounded-xl resize-none text-xs" disabled={isSaving} />
              </div>
            </div>

            {/* ── Preview + Telemetry Side ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-between">
                Source Preview
                <Badge variant="outline" className="text-[8px] bg-white border-emerald-500 text-emerald-600 font-black animate-pulse">LIVE</Badge>
              </Label>

              <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
                {/* Video preview with adaptive player */}
                {isVideo && (newUrl || currentItem?.url) ? (
                  extractYouTubeId(newUrl || currentItem?.url || '') ? (
                    <iframe
                      key={newUrl}
                      className="w-full h-full border-none"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(newUrl || currentItem?.url || '')}?start=${startTime}&autoplay=0&controls=1&vq=${youTubeVqParam(previewConfig?.qualityLabel || '1080p')}&rel=0&modestbranding=1`}
                      title="YouTube Player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <AdaptiveVideoPlayer
                      item={{ ...({} as MediaItem), id: '__preview__', name: newName, type: newType, source: sourceOrigin, url: newUrl || currentItem?.url || '', size: '', date: '', category: 'campus', videoClass, resolutionWidth: resW, resolutionHeight: resH, lazyLoad: enableLazy, quality: videoQuality }}
                      controls
                      showTelemetry
                      onPipelineReady={setPreviewConfig}
                    />
                  )
                ) : newType === 'website' && newUrl ? (
                  <div className="absolute inset-0 flex flex-col bg-white">
                    <div className="h-8 bg-zinc-100 border-b flex items-center px-3 gap-2 shrink-0">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="bg-white border rounded px-2 py-0.5 text-[8px] font-mono text-zinc-400 truncate flex-1 leading-none h-4 flex items-center">{newUrl}</div>
                    </div>
                    <iframe src={newUrl} className="w-full flex-1 border-none pointer-events-none scale-75 origin-top" title="Website Preview" />
                  </div>
                ) : newUrl ? (
                  <Image src={getMediaThumbnail(newUrl, newType)} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Radio className="w-8 h-8 text-white/20 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Awaiting Signal…</p>
                  </div>
                )}

                {/* Bottom HUD bar */}
                <div className="absolute bottom-3 left-3 right-3 z-30 flex items-end justify-between pointer-events-none">
                  <p className="text-[8px] font-black text-white bg-black/60 px-2 py-0.5 rounded truncate max-w-[120px] uppercase">{newName || "PENDING"}</p>
                  {previewConfig && (
                    <div className="bg-black/80 px-2 py-0.5 rounded font-mono text-[9px] text-primary border border-primary/30">
                      {previewConfig.qualityLabel} · {previewConfig.useAdaptiveStream ? 'ABR' : 'Direct'}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                    <span>Uploading to Cloud…</span><span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 rounded-full" />
                </div>
              )}

              {/* Pipeline telemetry panel */}
              {isVideo && <PipelineTelemetryPanel config={previewConfig} />}
            </div>
          </div>

          <DialogFooter className="border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6" disabled={isSaving}>Cancel</Button>
            <Button
              onClick={handleSaveMedia}
              className="gap-2 h-12 px-10 rounded-xl bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-tighter"
              disabled={isSaving}
            >
              {isSaving ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}%` : "Saving…"}</>
              ) : (
                <>{dialogMode === "add" ? <CheckCircle2 className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                   {dialogMode === "add" ? t("med.stageNew") : t("common.save")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
    </div>
  );
}
