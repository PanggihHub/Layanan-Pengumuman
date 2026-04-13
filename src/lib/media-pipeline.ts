/**
 * @fileOverview ScreenSense Adaptive Media Pipeline Engine
 *
 * Handles:
 *  - Automatic video class detection (Motion Video ≤1080p vs HD Stream >1080p)
 *  - Centralized GlobalQualityPolicy synced from Firestore settings/global
 *  - Real-time resolution probing from <video> elements
 *  - Device capacity fingerprinting (CPU cores, device memory, connection type)
 *  - Adaptive bitrate targeting with upgrade/downgrade ladder
 *  - Dynamic buffer sizing
 *  - Lazy loading recommendations
 *  - Smooth quality transition coordination
 */

import { MediaItem, VideoClass } from './mock-data';

// ── Constants ────────────────────────────────────────────────────────────────

/** Pixel threshold separating Motion Video (FHD) from HD Stream (UHD) classes */
export const FHD_THRESHOLD_HEIGHT = 1080;
export const FHD_THRESHOLD_WIDTH  = 1920;

/** Bitrate targets per resolution tier (kbps) */
export const BITRATE_TARGETS = {
  '480p':       1500,
  '720p':       3000,
  '1080p':      6000,
  '4K':        16000,
  '8K':        50000,
  'adaptive':   4500, // baseline for ABR selection
} as const;

/** Connection-aware quality caps */
export const CONNECTION_QUALITY_MAP: Record<string, string> = {
  'slow-2g': '480p',
  '2g':      '480p',
  '3g':      '720p',
  '4g':      '1080p',
  '5g':      '4K',
  'unknown': '1080p',
};

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Ordered quality ladder from lowest to highest.
 * Used for ABR upgrade/downgrade steps.
 */
export const QUALITY_LADDER = ['480p', '720p', '1080p', '4K', '8K'] as const;
export type QualityTier = typeof QUALITY_LADDER[number];

/**
 * GlobalQualityPolicy — stored in Firestore at `settings/global.qualityPolicy`
 * and broadcast in real-time to all endpoints (Media Library, Playlists, Screens, Displays).
 */
export interface GlobalQualityPolicy {
  /** Master mode controlling how quality is selected across the fleet */
  mode: 'auto'          // Full ABR — device + network decide
       | 'locked'       // Force every endpoint to exactly `lockedQuality`
       | 'capped'       // ABR but never exceed `maxQuality`
       | 'performance'; // Prefer stability — always use `fallbackQuality`

  /** Quality to lock all endpoints to (used when mode === 'locked') */
  lockedQuality: QualityTier;

  /** Maximum quality ceiling — ABR will not go above this (mode === 'capped') */
  maxQuality: QualityTier;

  /** Minimum quality floor — ABR will not go below this (all modes) */
  fallbackQuality: QualityTier;

  /** Whether ABR is enabled globally */
  abrEnabled: boolean;

  /** Pre-buffer seconds before switching to a higher quality tier */
  upgradeBufferSeconds: number;

  /** Number of stall events before downgrading one quality step */
  stallThreshold: number;

  /** Disable lazy loading globally (preload all assets immediately) */
  disableLazyLoad: boolean;

  /** Crossfade transition duration in ms when quality tier changes */
  transitionMs: number;
}

/** Default policy — shipped with the app, overridden by Firestore */
export const DEFAULT_QUALITY_POLICY: GlobalQualityPolicy = {
  mode:                'auto',
  lockedQuality:       '1080p',
  maxQuality:          '4K',
  fallbackQuality:     '720p',
  abrEnabled:          true,
  upgradeBufferSeconds: 12,
  stallThreshold:      2,
  disableLazyLoad:     false,
  transitionMs:        600,
};

export interface DeviceCapacity {
  cpuCores: number;
  deviceMemoryGB: number;
  connectionType: string;
  hardwareConcurrency: number;
  /** True if device is capable of smooth 4K+ playback */
  supports4K: boolean;
  /** Recommended quality cap for this device */
  recommendedQualityCap: string;
}

export interface PipelineConfig {
  videoClass: VideoClass;
  /** Whether real-time adaptive transcode pipeline should be used */
  useAdaptiveStream: boolean;
  /** Whether lazy loading is recommended for this asset */
  lazyLoad: boolean;
  /** Recommended buffer size hint in seconds */
  bufferSizeSeconds: number;
  /** Target bitrate in kbps */
  targetBitrateKbps: number;
  /** Detected or declared resolution */
  resolutionWidth: number;
  resolutionHeight: number;
  /** Human-readable quality tier label */
  qualityLabel: string;
  /** Codec recommendation */
  codecHint: string;
  /** The effective quality after applying global policy */
  effectiveQuality: string;
}

// ── Device Capacity Fingerprint ───────────────────────────────────────────────

/**
 * Probes the current browser/device for hardware and network capabilities.
 * Returns a rich DeviceCapacity object for downstream pipeline decisions.
 */
export function getDeviceCapacity(): DeviceCapacity {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      cpuCores: 4,
      deviceMemoryGB: 4,
      connectionType: 'unknown',
      hardwareConcurrency: 4,
      supports4K: false,
      recommendedQualityCap: '1080p',
    };
  }

  const nav = navigator as any;
  const cpuCores            = nav.hardwareConcurrency || 4;
  const deviceMemoryGB       = nav.deviceMemory        || 4;
  const conn                 = nav.connection || nav.mozConnection || nav.webkitConnection;
  const connectionType       = conn?.effectiveType || 'unknown';
  const hardwareConcurrency  = cpuCores;

  // 4K capable: needs ≥4 cores, ≥4 GB RAM, and a good connection
  const supports4K =
    cpuCores >= 4 &&
    deviceMemoryGB >= 4 &&
    (connectionType === '4g' || connectionType === '5g' || connectionType === 'unknown');

  // Connection-based quality cap
  const connectionCap = CONNECTION_QUALITY_MAP[connectionType] || '1080p';

  // Memory + CPU soft cap
  let hwCap = '4K';
  if (cpuCores < 2 || deviceMemoryGB < 2) hwCap = '720p';
  else if (cpuCores < 4 || deviceMemoryGB < 4) hwCap = '1080p';

  // Pick the more conservative of the two caps
  const qualityCaps = ['480p', '720p', '1080p', '4K', '8K'];
  const hwIdx   = qualityCaps.indexOf(hwCap);
  const connIdx = qualityCaps.indexOf(connectionCap === '5g' ? '4K' : connectionCap);
  const finalIdx = Math.min(hwIdx === -1 ? 2 : hwIdx, connIdx === -1 ? 2 : connIdx);
  const recommendedQualityCap = qualityCaps[Math.max(0, finalIdx)];

  return {
    cpuCores,
    deviceMemoryGB,
    connectionType,
    hardwareConcurrency,
    supports4K,
    recommendedQualityCap,
  };
}

// ── Resolution Detection ──────────────────────────────────────────────────────

/**
 * Probes the intrinsic resolution of a <video> element for classification.
 * Resolves with { width, height } once metadata is loaded.
 */
export function probeVideoResolution(
  videoEl: HTMLVideoElement
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (videoEl.readyState >= 1) {
      resolve({ width: videoEl.videoWidth, height: videoEl.videoHeight });
      return;
    }
    const onMeta = () => {
      videoEl.removeEventListener('loadedmetadata', onMeta);
      videoEl.removeEventListener('error', onErr);
      resolve({ width: videoEl.videoWidth, height: videoEl.videoHeight });
    };
    const onErr = () => {
      videoEl.removeEventListener('loadedmetadata', onMeta);
      videoEl.removeEventListener('error', onErr);
      reject(new Error('Video metadata load failed'));
    };
    videoEl.addEventListener('loadedmetadata', onMeta);
    videoEl.addEventListener('error', onErr);
  });
}

// ── Class Classification Engine ───────────────────────────────────────────────

/**
 * Determines the video class from a given pixel resolution.
 *
 * Rules:
 *   height ≤ 1080 (FHD)            → 'motion_video'
 *   height >  1080 (UHD/4K/8K)     → 'hd_stream'
 *   height === 0  (unknown)         → 'adaptive' (system decides at runtime)
 */
export function classifyByResolution(
  width: number,
  height: number
): VideoClass {
  if (height === 0 && width === 0) return 'adaptive';
  if (height <= FHD_THRESHOLD_HEIGHT && width <= FHD_THRESHOLD_WIDTH) return 'motion_video';
  return 'hd_stream';
}

/**
 * Given a quality label string (e.g. "1080p", "4K", "720p"), returns the
 * VideoClass and target dimensions.
 */
export function classifyByQualityLabel(label: string): {
  videoClass: VideoClass;
  width: number;
  height: number;
} {
  const map: Record<string, { videoClass: VideoClass; width: number; height: number }> = {
    '480p':      { videoClass: 'motion_video', width: 854,  height: 480  },
    '720p':      { videoClass: 'motion_video', width: 1280, height: 720  },
    '1080p':     { videoClass: 'motion_video', width: 1920, height: 1080 },
    'fhd':       { videoClass: 'motion_video', width: 1920, height: 1080 },
    '4k':        { videoClass: 'hd_stream',    width: 3840, height: 2160 },
    'uhd':       { videoClass: 'hd_stream',    width: 3840, height: 2160 },
    '8k':        { videoClass: 'hd_stream',    width: 7680, height: 4320 },
    'auto':      { videoClass: 'adaptive',     width: 0,    height: 0    },
    'adaptive':  { videoClass: 'adaptive',     width: 0,    height: 0    },
  };
  return map[label.toLowerCase()] || { videoClass: 'adaptive', width: 0, height: 0 };
}

// ── Pipeline Configuration Builder ───────────────────────────────────────────

/**
 * Builds a full PipelineConfig for a media item, combining:
 *  - Stored videoClass / resolution metadata
 *  - Live device capacity fingerprint
 *  - Connection-aware quality cap
 *  - Optional global quality policy override
 */
export function buildPipelineConfig(
  item: MediaItem,
  device?: DeviceCapacity,
  policy?: GlobalQualityPolicy
): PipelineConfig {
  const cap    = device ?? getDeviceCapacity();
  const pol    = policy ?? DEFAULT_QUALITY_POLICY;

  // 1. Resolve dimensions
  const w = item.resolutionWidth  || 0;
  const h = item.resolutionHeight || 0;

  // 2. Determine raw class from stored data or quality label
  let rawClass: VideoClass =
    item.videoClass ||
    (item.quality ? classifyByQualityLabel(item.quality).videoClass : 'adaptive');

  // 3. If we have explicit dimensions, re-classify (dimensions are ground truth)
  if (w > 0 && h > 0) {
    rawClass = classifyByResolution(w, h);
  }

  // 4. Device cap downgrade: if device can't do 4K, force motion_video
  if (rawClass === 'hd_stream' && !cap.supports4K) {
    rawClass = 'motion_video';
  }

  // 5. Build derivative properties
  const useAdaptiveStream   = (pol.abrEnabled && pol.mode !== 'locked') &&
                              (rawClass === 'hd_stream' || rawClass === 'adaptive');
  const lazyLoad            = pol.disableLazyLoad ? false : (item.lazyLoad ?? (rawClass === 'hd_stream'));
  const bufferSizeSeconds   = rawClass === 'hd_stream' ? pol.upgradeBufferSeconds : 4;

  // Target bitrate from quality label, or resolution-derived
  const qualityLabel = deriveQualityLabel(w, h, rawClass, cap.recommendedQualityCap);
  const targetBitrateKbps =
    item.bitrateKbps ||
    BITRATE_TARGETS[qualityLabel as keyof typeof BITRATE_TARGETS] ||
    BITRATE_TARGETS['adaptive'];

  // Codec: prefer AV1 for 4K streams, H.264 for FHD
  const codecHint = item.codecHint ||
    (rawClass === 'hd_stream' ? 'av1,h265,vp9,h264' : 'h264,vp9');

  // 6. Apply global policy to derive effective quality
  const effectiveQuality = resolveEffectiveQuality(qualityLabel, cap, pol);

  return {
    videoClass:        rawClass,
    useAdaptiveStream,
    lazyLoad,
    bufferSizeSeconds,
    targetBitrateKbps,
    resolutionWidth:   w,
    resolutionHeight:  h,
    qualityLabel,
    codecHint,
    effectiveQuality,
  };
}

/**
 * Applies a GlobalQualityPolicy to a raw quality label and device cap,
 * returning the final quality string that should be used for playback.
 *
 * Priority chain:
 *   locked > device_cap > max_cap > (auto/capped ABR) > fallback
 */
export function resolveEffectiveQuality(
  rawQuality: string,
  device: DeviceCapacity,
  policy: GlobalQualityPolicy
): string {
  const ladder = QUALITY_LADDER as readonly string[];

  // Locked mode: every endpoint plays exactly this quality
  if (policy.mode === 'locked') {
    return policy.lockedQuality;
  }

  // Performance mode: stabilized quality, avoid high resolutions
  if (policy.mode === 'performance') {
    return policy.fallbackQuality;
  }

  // For 'auto' and 'capped' modes, apply hierarchical caps:
  const rawIdx      = ladder.indexOf(rawQuality);
  const maxIdx      = ladder.indexOf(policy.maxQuality);
  const deviceIdx   = ladder.indexOf(device.recommendedQualityCap);
  const fallbackIdx = ladder.indexOf(policy.fallbackQuality);

  // Cap at device capability
  let effectiveIdx = rawIdx === -1 ? 2 : rawIdx;
  effectiveIdx = Math.min(effectiveIdx, deviceIdx === -1 ? 2 : deviceIdx);

  // Cap at policy maxQuality
  if (maxIdx !== -1) {
    effectiveIdx = Math.min(effectiveIdx, maxIdx);
  }

  // Never go below fallback floor
  if (fallbackIdx !== -1) {
    effectiveIdx = Math.max(effectiveIdx, fallbackIdx);
  }

  return ladder[Math.max(0, Math.min(effectiveIdx, ladder.length - 1))];
}

/**
 * Helper: determines a human-readable quality label from dimensions and class.
 */
export function deriveQualityLabel(
  w: number,
  h: number,
  videoClass: VideoClass,
  deviceCap: string
): string {
  if (videoClass === 'adaptive') return deviceCap || 'auto';
  if (h >= 4320 || w >= 7680) return '8K';
  if (h >= 2160 || w >= 3840) return '4K';
  if (h >= 1080 || w >= 1920) return '1080p';
  if (h >= 720  || w >= 1280) return '720p';
  if (h >= 480  || w >= 854)  return '480p';
  if (h === 0 && w === 0)     return deviceCap || 'auto';
  return '480p';
}

// ── Adaptive Bitrate Control ──────────────────────────────────────────────────

/**
 * Monitors a <video> element for stall events and adjusts a quality tier
 * recommendation with both downgrade and upgrade logic.
 *
 * Downgrade: after `stallThreshold` consecutive stall events → drop one tier.
 * Upgrade:   after `upgradeBufferSeconds` of stall-free playback → try one tier up.
 *
 * Returns a cleanup function.
 */
export function attachAdaptiveBitrateMonitor(
  videoEl: HTMLVideoElement,
  currentQuality: string,
  onQualityChange: (newQuality: string, direction: 'up' | 'down') => void,
  policy?: GlobalQualityPolicy
): () => void {
  const pol          = policy ?? DEFAULT_QUALITY_POLICY;
  const qualityLadder = [...QUALITY_LADDER];
  let stallCount     = 0;
  let smoothSeconds  = 0;
  let currentIdx     = qualityLadder.indexOf(currentQuality as QualityTier);
  if (currentIdx === -1) currentIdx = 2; // default to 1080p

  const maxIdx      = qualityLadder.indexOf(pol.maxQuality);
  const fallbackIdx = qualityLadder.indexOf(pol.fallbackQuality);
  let upgradeInProgress = false;

  const handleWaiting = () => {
    stallCount   += 1;
    smoothSeconds = 0; // reset smooth counter on any stall
    if (stallCount >= pol.stallThreshold && currentIdx > Math.max(0, fallbackIdx)) {
      currentIdx  -= 1;
      stallCount   = 0;
      onQualityChange(qualityLadder[currentIdx], 'down');
    }
  };

  // Upgrade ticker: increments every second of smooth playback
  const upgradeTick = setInterval(() => {
    if (!pol.abrEnabled || pol.mode === 'locked' || pol.mode === 'performance') return;
    smoothSeconds += 1;
    if (
      smoothSeconds >= pol.upgradeBufferSeconds &&
      !upgradeInProgress &&
      currentIdx < Math.min(qualityLadder.length - 1, maxIdx === -1 ? 99 : maxIdx)
    ) {
      upgradeInProgress = true;
      smoothSeconds     = 0;
      currentIdx       += 1;
      onQualityChange(qualityLadder[currentIdx], 'up');
      // Lock out further upgrades for 2× buffer period to confirm stability
      setTimeout(() => { upgradeInProgress = false; }, pol.upgradeBufferSeconds * 2000);
    }
  }, 1000);

  const handleStalled = () => handleWaiting();

  videoEl.addEventListener('waiting', handleWaiting);
  videoEl.addEventListener('stalled', handleStalled);

  return () => {
    videoEl.removeEventListener('waiting', handleWaiting);
    videoEl.removeEventListener('stalled', handleStalled);
    clearInterval(upgradeTick);
  };
}

// ── YouTube Quality Mapping ───────────────────────────────────────────────────

/**
 * Maps a quality label to a YouTube `vq=` URL parameter value.
 */
export function youTubeVqParam(qualityLabel: string): string {
  const map: Record<string, string> = {
    '480p':  'large',
    '720p':  'hd720',
    '1080p': 'hd1080',
    '4K':    'hd2160',
    '8K':    'hd2880',
    'auto':  'hd1080',
  };
  return map[qualityLabel] || 'hd1080';
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

export interface VideoClassBadgeInfo {
  label:    string;
  color:    string;
  bgColor:  string;
  icon:     'film' | 'zap' | 'cpu';
  tooltip:  string;
}

/**
 * Returns display metadata for the VideoClass badge shown in the Media Library UI.
 */
export function getVideoClassBadge(videoClass?: VideoClass): VideoClassBadgeInfo {
  switch (videoClass) {
    case 'motion_video':
      return {
        label:   'Motion Video',
        color:   'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200',
        icon:    'film',
        tooltip: '≤1080p FHD — Direct play, low-latency pipeline. No transcode required.',
      };
    case 'hd_stream':
      return {
        label:   'HD Stream',
        color:   'text-violet-700',
        bgColor: 'bg-violet-50 border-violet-200',
        icon:    'zap',
        tooltip: '>1080p UHD/4K/8K — Real-time adaptive transcode with ABR and dynamic buffering.',
      };
    case 'adaptive':
    default:
      return {
        label:   'Adaptive',
        color:   'text-sky-700',
        bgColor: 'bg-sky-50 border-sky-200',
        icon:    'cpu',
        tooltip: 'Auto-detected at runtime based on device capacity and network conditions.',
      };
  }
}
