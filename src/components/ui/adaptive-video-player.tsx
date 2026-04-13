"use client";

/**
 * @fileOverview AdaptiveVideoPlayer
 *
 * A smart <video> wrapper that:
 *  1. Probes intrinsic resolution and auto-classifies (Motion Video / HD Stream)
 *  2. Monitors for stall events and adjusts quality tier recommendations
 *  3. Implements lazy loading via IntersectionObserver
 *  4. Applies dynamic buffer hints via MediaSource / resource hints
 *  5. Renders a translucent overlay with live pipeline telemetry
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MediaItem, VideoClass } from "@/lib/mock-data";
import {
  buildPipelineConfig,
  attachAdaptiveBitrateMonitor,
  probeVideoResolution,
  getDeviceCapacity,
  PipelineConfig,
  getVideoClassBadge,
} from "@/lib/media-pipeline";
import { cn } from "@/lib/utils";
import { Zap, Film, Cpu, Wifi, AlertCircle, RefreshCw } from "lucide-react";

interface AdaptiveVideoPlayerProps {
  item: MediaItem;
  /** Show live pipeline telemetry overlay */
  showTelemetry?: boolean;
  /** Custom class for the outer container */
  className?: string;
  /** Autoplay (muted, required for browsers) */
  autoPlay?: boolean;
  /** Loop the video */
  loop?: boolean;
  controls?: boolean;
  /** Called when the pipeline config is resolved */
  onPipelineReady?: (config: PipelineConfig) => void;
}

const ClassIcon: Record<VideoClass, React.ElementType> = {
  motion_video: Film,
  hd_stream:    Zap,
  adaptive:     Cpu,
};

export function AdaptiveVideoPlayer({
  item,
  showTelemetry = false,
  className,
  autoPlay = false,
  loop = false,
  controls = true,
  onPipelineReady,
}: AdaptiveVideoPlayerProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const [config, setConfig]         = useState<PipelineConfig | null>(null);
  const [isVisible, setIsVisible]   = useState(false);  // lazy load gate
  const [isStalled, setIsStalled]   = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [hasError, setHasError]     = useState(false);
  const [detectedRes, setDetectedRes] = useState<{ w: number; h: number } | null>(null);
  const [liveQuality, setLiveQuality] = useState<string>('auto');

  // ── 1. Lazy loading via IntersectionObserver ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  // ── 2. Build initial pipeline config from item metadata ──────────────────
  useEffect(() => {
    const device = getDeviceCapacity();
    const cfg    = buildPipelineConfig(item, device);
    setConfig(cfg);
    setLiveQuality(cfg.qualityLabel);
    onPipelineReady?.(cfg);
  }, [item]);

  // ── 3. Probe resolution once video metadata loads, re-classify ───────────
  const handleMetadata = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const { width, height } = await probeVideoResolution(video);
      setDetectedRes({ w: width, h: height });

      // Re-build config with real dimensions
      if (width > 0 && height > 0) {
        const device = getDeviceCapacity();
        const updatedItem = { ...item, resolutionWidth: width, resolutionHeight: height };
        const cfg = buildPipelineConfig(updatedItem, device);
        setConfig(cfg);
        setLiveQuality(cfg.qualityLabel);
        onPipelineReady?.(cfg);
      }
    } catch (_) { /* non-fatal */ }
    setIsLoading(false);
  }, [item]);

  // ── 4. Attach ABR monitor after video is ready ───────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !config) return;

    const cleanup = attachAdaptiveBitrateMonitor(video, liveQuality, (newQ) => {
      setLiveQuality(newQ);
    });

    const onWaiting = () => setIsStalled(true);
    const onPlaying = () => setIsStalled(false);
    const onError   = () => setHasError(true);

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error',   onError);

    return () => {
      cleanup();
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error',   onError);
    };
  }, [config, liveQuality]);

  const badge = getVideoClassBadge(config?.videoClass);
  const Icon  = config ? ClassIcon[config.videoClass] : Cpu;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn("relative w-full h-full bg-zinc-950 overflow-hidden", className)}>
      {/* Lazy load placeholder */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
        </div>
      )}

      {/* Actual video element — only rendered when visible (lazy) */}
      {isVisible && !hasError && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay={autoPlay}
          loop={loop}
          muted={autoPlay}
          controls={controls}
          playsInline
          preload={config?.lazyLoad ? 'none' : 'metadata'}
          onLoadedMetadata={handleMetadata}
          onError={() => setHasError(true)}
        >
          <source src={item.url} />
          Your browser does not support HTML5 video.
        </video>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
          <AlertCircle className="w-10 h-10 text-red-500/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Source Unavailable
          </p>
        </div>
      )}

      {/* Stall indicator */}
      {isStalled && !hasError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 animate-pulse">
          <div className="bg-black/80 px-4 py-2 rounded-full flex items-center gap-2">
            <Wifi className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              Buffering…
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && isVisible && !hasError && (
        <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center z-20">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Live Telemetry HUD */}
      {showTelemetry && config && (
        <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none flex items-end justify-between gap-2">
          {/* Class badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md",
            badge.bgColor, badge.color
          )}>
            <Icon className="w-3 h-3" />
            {badge.label}
          </div>

          {/* Live quality & bitrate */}
          <div className="flex flex-col items-end gap-1">
            <div className="bg-black/80 border border-primary/30 px-2 py-0.5 rounded font-mono text-[9px] text-primary font-black backdrop-blur-md">
              {liveQuality} · {config.targetBitrateKbps >= 1000
                ? `${(config.targetBitrateKbps / 1000).toFixed(1)} Mbps`
                : `${config.targetBitrateKbps} kbps`}
            </div>
            {detectedRes && (
              <div className="bg-black/60 px-2 py-0.5 rounded font-mono text-[8px] text-zinc-400">
                {detectedRes.w}×{detectedRes.h}px
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
