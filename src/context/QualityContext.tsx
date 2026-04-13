"use client";

/**
 * @fileOverview QualityContext
 *
 * A React context providing the GlobalQualityPolicy to all components.
 *
 *  - Reads `settings/global.qualityPolicy` from Firestore in real-time
 *  - Exposes `policy`, `setPolicy()`, and convenience helpers
 *  - Any change in the Admin Dashboard propagates instantly to:
 *      · Media Library (preview panel)
 *      · Playlists (sequence editor)
 *      · Screens (fleet manager)
 *      · Display Client (playback loop)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  GlobalQualityPolicy,
  DEFAULT_QUALITY_POLICY,
  resolveEffectiveQuality,
  getDeviceCapacity,
  QUALITY_LADDER,
  QualityTier,
} from "@/lib/media-pipeline";

// ── Context Shape ─────────────────────────────────────────────────────────────

interface QualityContextValue {
  /** Current live policy (from Firestore, or default) */
  policy: GlobalQualityPolicy;

  /** Whether the policy has been loaded from Firestore */
  isLoaded: boolean;

  /**
   * Apply a full or partial policy update.
   * Merges with the current policy and persists to Firestore.
   */
  updatePolicy: (patch: Partial<GlobalQualityPolicy>) => Promise<void>;

  /**
   * Convenience: returns the effective quality for the current device,
   * applying the global policy. Use this wherever you render a video.
   */
  resolveQuality: (rawQuality: string) => string;

  /** True when the save is in-flight */
  isSaving: boolean;
}

const QualityContext = createContext<QualityContextValue>({
  policy:          DEFAULT_QUALITY_POLICY,
  isLoaded:        false,
  updatePolicy:    async () => {},
  resolveQuality:  (q) => q,
  isSaving:        false,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function QualityProvider({ children }: { children: ReactNode }) {
  const [policy, setPolicy]     = useState<GlobalQualityPolicy>(DEFAULT_QUALITY_POLICY);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Subscribe to Firestore settings/global.qualityPolicy
  useEffect(() => {
    const ref = doc(db, "settings", "global");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const raw = snap.data()?.qualityPolicy;
        if (raw && typeof raw === "object") {
          // Merge with defaults to handle missing fields
          setPolicy({ ...DEFAULT_QUALITY_POLICY, ...raw });
        }
      }
      setIsLoaded(true);
    }, () => {
      // Network error — keep using local policy
      setIsLoaded(true);
    });
    return () => unsub();
  }, []);

  // Persist partial policy updates to Firestore
  const updatePolicy = useCallback(async (patch: Partial<GlobalQualityPolicy>) => {
    const next = { ...policy, ...patch };
    setPolicy(next);
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "global"),
        { qualityPolicy: next },
        { merge: true }
      );
    } finally {
      setIsSaving(false);
    }
  }, [policy]);

  // Resolve effective quality for this device + current policy
  const resolveQuality = useCallback((rawQuality: string): string => {
    const device = getDeviceCapacity();
    return resolveEffectiveQuality(rawQuality, device, policy);
  }, [policy]);

  return (
    <QualityContext.Provider value={{ policy, isLoaded, updatePolicy, resolveQuality, isSaving }}>
      {children}
    </QualityContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useQuality() {
  return useContext(QualityContext);
}

// ── Re-export helpers for convenience ─────────────────────────────────────────
export { QUALITY_LADDER, type QualityTier, type GlobalQualityPolicy };
