"use client";

/**
 * SmartTicker — Priority-queue ticker for ScreenSense displays.
 *
 * Features:
 * - Priority queue: urgent → normal → info
 * - Auto-expires messages past their expiresAt timestamp
 * - Smooth CSS linear-scroll, restarts seamlessly between messages
 * - Speed control (px/s), per-message duration, label + icon theming
 * - Stable fallback during Firestore reconnects (shows last known message)
 * - Zero flicker on message transitions (opacity crossfade)
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Megaphone, AlertTriangle, Info, Zap } from "lucide-react";
import { TickerMessage } from "@/lib/mock-data";

// ── Priority config ────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: {
    bg:    "bg-red-600",
    label: "bg-red-800 text-white",
    icon:  AlertTriangle,
    tag:   "URGENT",
    textColor: "text-white",
    glow:  "shadow-[0_0_20px_rgba(220,38,38,0.5)]",
  },
  normal: {
    bg:    "bg-primary/90 backdrop-blur-sm",
    label: "bg-accent text-primary",
    icon:  Megaphone,
    tag:   "INFO",
    textColor: "text-white",
    glow:  "",
  },
  info: {
    bg:    "bg-zinc-800/80 backdrop-blur-sm",
    label: "bg-zinc-600 text-white",
    icon:  Info,
    tag:   "NOTICE",
    textColor: "text-white/80",
    glow:  "",
  },
} as const;

// ── Props ──────────────────────────────────────────────────────────────────────

interface SmartTickerProps {
  messages: TickerMessage[];
  /** Scrolling speed in pixels per second. Default 80. */
  speedPxPerSec?: number;
  /** Height of the ticker bar. Default 56 (px). */
  height?: number;
  /** Font size class. Default "text-xl". */
  textSize?: string;
  /** Fallback message shown when no active messages exist */
  fallback?: string;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SmartTicker({
  messages,
  speedPxPerSec = 80,
  height = 56,
  textSize = "text-xl",
  fallback = "",
  className,
}: SmartTickerProps) {
  const trackRef  = useRef<HTMLDivElement>(null);
  const innerRef  = useRef<HTMLSpanElement>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible]       = useState(true);   // for crossfade
  const [animKey, setAnimKey]       = useState(0);      // force CSS restart

  // ── Filter + sort the queue ────────────────────────────────────────────────
  const queue = useMemo<TickerMessage[]>(() => {
    const now   = Date.now();
    const valid = messages.filter(m => {
      if (!m.active)    return false;
      if (!m.message?.trim()) return false;
      if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
      return true;
    });
    const priority = { urgent: 0, normal: 1, info: 2 };
    return [...valid].sort((a, b) => {
      const pd = priority[a.priority] - priority[b.priority];
      if (pd !== 0) return pd;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [messages]);

  const hasMessages = queue.length > 0;

  // ── Current message index bound-checking ────────────────────────────────────
  const safeIdx = hasMessages ? currentIdx % queue.length : 0;
  const current = hasMessages ? queue[safeIdx] : null;

  // ── Advance to next message ────────────────────────────────────────────────
  const advance = () => {
    if (!hasMessages) return;
    setVisible(false);
    setTimeout(() => {
      setCurrentIdx(i => (i + 1) % queue.length);
      setAnimKey(k => k + 1);
      setVisible(true);
    }, 250);   // 250ms crossfade out → in
  };

  // ── Calculate scroll duration from content width ────────────────────────────
  useEffect(() => {
    if (!innerRef.current || !trackRef.current) return;
    const contentW = innerRef.current.scrollWidth;
    if (contentW === 0) return;

    const duration = contentW / speedPxPerSec;

    innerRef.current.style.animationDuration  = `${duration}s`;
    innerRef.current.style.animationName      = "ticker-scroll";
    innerRef.current.style.animationTimingFunction = "linear";
    innerRef.current.style.animationIterationCount = "1";
    innerRef.current.style.animationFillMode       = "none";

    // Advance to next message after one full scroll
    const timeout = setTimeout(advance, duration * 1000);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, current?.id, speedPxPerSec]);

  // ── Also rotate on expiresAt changes ─────────────────────────────────────
  useEffect(() => {
    if (!hasMessages) return;
    // Re-clamp index in case queue shrinks
    setCurrentIdx(i => (queue.length > 0 ? i % queue.length : 0));
  }, [queue.length, hasMessages]);

  if (!hasMessages && !fallback) return null;

  const cfg = current ? PRIORITY_CONFIG[current.priority] : PRIORITY_CONFIG.info;
  const LabelIcon = cfg.icon;

  const displayMessage = current?.message ?? fallback;
  if (!displayMessage) return null;

  return (
    <div
      className={cn(
        "w-full overflow-hidden flex items-center relative transition-all duration-300",
        cfg.bg, cfg.glow, className,
      )}
      style={{ height }}
    >
      {/* Left label pill */}
      <div className={cn(
        "absolute left-0 top-0 h-full flex items-center px-5 gap-2 z-20 shrink-0",
        cfg.label,
        "shadow-[8px_0_20px_rgba(0,0,0,0.4)]",
      )}>
        <LabelIcon className="w-4 h-4 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {cfg.tag}
        </span>
      </div>

      {/* Scrolling track */}
      <div ref={trackRef} className="flex-1 overflow-hidden ml-[110px] relative" style={{ height }}>
        <span
          key={animKey}
          ref={innerRef}
          className={cn(
            "inline-block whitespace-nowrap font-bold leading-none",
            cfg.textColor, textSize,
            "transition-opacity duration-250",
            visible ? "opacity-100" : "opacity-0",
          )}
          style={{
            position: "relative",
            willChange: "transform",
            paddingLeft: "100vw",   // start off-screen right
            animationName: "ticker-scroll",
          }}
        >
          {displayMessage}
          <span className="opacity-30 mx-12">·</span>
          {displayMessage}
        </span>
      </div>

      {/* Priority indicator dot (urgent only) */}
      {current?.priority === "urgent" && (
        <div className="absolute right-4 flex items-center gap-1.5 z-20 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}
