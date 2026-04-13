"use client";

/**
 * @fileOverview AdaptiveVideoPlayer
 *
 * A globally-aware smart <video> wrapper that:
 *  1. Subscribes to QualityContext — responds instantly to global policy changes
 *  2. Auto-classifies (Motion Video ≤1080p / HD Stream >1080p) via resolution probe
 *  3. Monitors stall/smooth events with upgrade + downgrade ABR ladder
 *  4. Implements lazy loading via IntersectionObserver
 *  5. Applies smooth CSS crossfade on every quality-change transition
 *  6. Renders a translucent live pipeline telemetry HUD
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MediaItem, VideoClass } from "@/lib/mock-data";
import {
  buildPipelineConfig,
  attachAdaptiveBitrateMonitor,
  probeVideoResolution,
  getDeviceCapacity,
  PipelineConfig,
  getVideoClassBadge,
  youTubeVqParam,
  BITRATE_TARGETS,
} from "@/lib/media-pipeline";
import { useQuality } from "@/context/QualityContext";
import { cn } from "@/lib/utils";
import { Zap, Film, Cpu, Wifi, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdaptiveVideoPlayerProps {
  item: MediaItem;
  /** Show live pipeline telemetry HUD overlay */
  showTelemetry?: boolean;
  /** Custom class for the outer container */
  className?: string;
  /** Autoplay (muted, required for browsers) */
  autoPlay?: boolean;
  /** Loop the video */
  loop?: boolean;
  controls?: boolean;
  /** Called when the pipeline config is resolved or changes */
  onPipelineReady?: (config: PipelineConfig) => void;
  /** Override: if set, use this quality instead of computed */
  qualityOverride?: string;
}

const ClassIcon: Record<VideoClass, React.ElementType> = {
  motion_video: Film,
  hd_stream:    Zap,
  adaptive:     Cpu,
};

// ── Component ──────────────────────────────────────────────────────────────────

export function AdaptiveVideoPlayer({
  item,
  showTelemetry = false,
  className,
  autoPlay = false,
  loop = false,
  controls = true,
  onPipelineReady,
  qualityOverride,
}: AdaptiveVideoPlayerProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const { policy, resolveQuality, isLoaded } = useQuality();

  const [config, setConfig]               = useState<PipelineConfig | null>(null);
  const [isVisible, setIsVisible]         = useState(false);  // lazy gate
  const [isStalled, setIsStalled]         = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [hasError, setHasError]           = useState(false);
  const [detectedRes, setDetectedRes]     = useState<{ w: number; h: number } | null>(null);
  const [liveQuality, setLiveQuality]     = useState<string>('auto');
  const [lastDirection, setLastDirection] = useState<'up' | 'down' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── 1. Lazy loading via IntersectionObserver ────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); io.disconnect(); } },
      { rootMargin: "300px" } // slightly larger margin for smoother entry
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  // ── 2. Build pipeline config, applying global policy ───────────────────────
  useEffect(() => {
    if (!isLoaded) return; // wait for policy to load before first render
    const device = getDeviceCapacity();
    const cfg    = buildPipelineConfig(item, device, policy);
    const eq     = qualityOverride ? resolveQuality(qualityOverride) : cfg.effectiveQuality;
    setConfig({ ...cfg, effectiveQuality: eq });
    setLiveQuality(eq);
    onPipelineReady?.({ ...cfg, effectiveQuality: eq });
  }, [item, policy, isLoaded, qualityOverride]);

  // ── 3. Probe resolution on video metadata load ─────────────────────────────
  const handleMetadata = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const { width, height } = await probeVideoResolution(video);
      setDetectedRes({ w: width, h: height });
      if (width > 0 && height > 0) {
        const device      = getDeviceCapacity();
        const updatedItem = { ...item, resolutionWidth: width, resolutionHeight: height };
        const cfg         = buildPipelineConfig(updatedItem, device, policy);
        const eq          = qualityOverride ? resolveQuality(qualityOverride) : cfg.effectiveQuality;
        setConfig({ ...cfg, effectiveQuality: eq });
        setLiveQuality(eq);
        onPipelineReady?.({ ...cfg, effectiveQuality: eq });
      }
    } catch (_) { /* non-fatal */ }
    setIsLoading(false);
  }, [item, policy, qualityOverride]);

  // ── 4. Re-apply policy whenever it changes (global broadcast) ─────────────
  useEffect(() => {
    if (!config || !isLoaded) return;
    const device = getDeviceCapacity();
    const newEq  = qualityOverride
      ? resolveQuality(qualityOverride)
      : resolveQuality(config.qualityLabel);

    if (newEq !== liveQuality) {
      triggerTransition(() => setLiveQuality(newEq));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy, isLoaded]);

  // ── 5. Smooth crossfade transition helper ──────────────────────────────────
  const triggerTransition = useCallback((applyChange: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      applyChange();
      setIsTransitioning(false);
    }, policy.transitionMs / 2);
  }, [policy.transitionMs]);

  // ── 6. Attach ABR monitor after video is ready ─────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !config || !isLoaded) return;

    const cleanup = attachAdaptiveBitrateMonitor(
      video,
      liveQuality,
      (newQ, direction) => {
        setLastDirection(direction);
        triggerTransition(() => {
          setLiveQuality(newQ);
          // Clear direction badge after 3 s
          setTimeout(() => setLastDirection(null), 3000);
        });
      },
      policy
    );

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
  // Only re-attach if config or policy changes — not on every liveQuality update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.videoClass, policy, isLoaded]);

  // ── Bitrate label helper ───────────────────────────────────────────────────
  const bitrateLabel = useMemo(() => {
    const kbps =
      BITRATE_TARGETS[liveQuality as keyof typeof BITRATE_TARGETS] ||
      config?.targetBitrateKbps || 0;
    return kbps >= 1000
      ? `${(kbps / 1000).toFixed(1)} Mbps`
      : `${kbps} kbps`;
  }, [liveQuality, config]);

  const badge = getVideoClassBadge(config?.videoClass);
  const Icon  = config ? ClassIcon[config.videoClass] : Cpu;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full bg-zinc-950 overflow-hidden", className)}
    >
      {/* Lazy load placeholder */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
        </div>
      )}

      {/* Crossfade transition overlay */}
      {isTransitioning && (
        <div
          className="absolute inset-0 bg-black z-50 pointer-events-none"
          style={{
            animation: `quality-crossfade ${policy.transitionMs}ms ease-in-out forwards`,
          }}
        />
      )}

      {/* Actual video element — only rendered when visible (lazy gate) */}
      {isVisible && !hasError && (
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            isTransitioning && "opacity-0"
          )}
          autoPlay={autoPlay}
          loop={loop}
          muted={autoPlay}
          controls={controls}
          playsInline
          preload={
            policy.disableLazyLoad
              ? 'auto'
              : config?.lazyLoad ? 'none' : 'metadata'
          }
          onLoadedMetadata={handleMetadata}
          onError={() => setHasError(true)}
        >
          <source src={item.url} />
          Your browser does not support HTML5 video.
        </video>
      )}

      {/* Error — source unavailable icon */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
          <AlertCircle className="w-10 h-10 text-red-500/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Source Unavailable
          </p>
        </div>
      )}

      {/* Buffering stall indicator */}
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

      {/* Loading spinner */}
      {isLoading && isVisible && !hasError && (
        <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center z-20">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* ABR direction notification badge */}
      {lastDirection && !isTransitioning && (
        <div className={cn(
          "absolute top-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2",
          lastDirection === 'up'
            ? 'bg-emerald-500/90 text-white'
            : 'bg-amber-500/90 text-white'
        )}>
          {lastDirection === 'up'
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {lastDirection === 'up' ? `Upgraded → ${liveQuality}` : `Adjusted → ${liveQuality}`}
        </div>
      )}

      {/* Live Telemetry HUD */}
      {showTelemetry && config && (
        <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none flex items-end justify-between gap-2">
          {/* Pipeline class badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md",
            badge.bgColor, badge.color
          )}>
            <Icon className="w-3 h-3" />
            {badge.label}
            {policy.mode !== 'auto' && (
              <span className="ml-1 opacity-60">· {policy.mode}</span>
            )}
          </div>

          {/* Quality + bitrate + resolution */}
          <div className="flex flex-col items-end gap-1">
            <div className="bg-black/80 border border-primary/30 px-2 py-0.5 rounded font-mono text-[9px] text-primary font-black backdrop-blur-md">
              {liveQuality} · {bitrateLabel}
            </div>
            {detectedRes && (
              <div className="bg-black/60 px-2 py-0.5 rounded font-mono text-[8px] text-zinc-400">
                {detectedRes.w}×{detectedRes.h}px
              </div>
            )}
            <div className="bg-black/60 px-2 py-0.5 rounded font-mono text-[8px] text-zinc-500">
              Policy: {policy.mode} · {policy.abrEnabled ? 'ABR' : 'Fixed'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
