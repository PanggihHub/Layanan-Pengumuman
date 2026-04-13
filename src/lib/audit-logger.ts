/**
 * useAuditLogger — Centralized security audit log writer.
 *
 * All security events (auth, config changes, lockout, access, illegal attempts)
 * are written to the "securityLogs" Firestore collection via this hook.
 * The admin Overview page reads from the same collection.
 *
 * Schema for each log entry:
 *   event      — human-readable event name
 *   timestamp  — ISO 8601 string (server time)
 *   user       — actor identifier ("admin", "system", or "anonymous")
 *   status     — Success | Failed | Blocked | Warning | Verified
 *   category   — auth | config | access | lockout | system
 *   details    — optional human-readable supplemental information
 *   ip         — optional client IP (populated when available)
 */

import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { SecurityAuditLog } from "@/lib/mock-data";

type LogStatus   = SecurityAuditLog["status"];
type LogCategory = SecurityAuditLog["category"];

interface LogPayload {
  event    : string;
  status   : LogStatus;
  category : LogCategory;
  details ?: string;
  user    ?: string;
  ip      ?: string;
}

export async function writeAuditLog(payload: LogPayload): Promise<void> {
  try {
    await addDoc(collection(db, "securityLogs"), {
      event     : payload.event,
      timestamp : new Date().toISOString(),
      user      : payload.user ?? "admin",
      status    : payload.status,
      category  : payload.category,
      details   : payload.details ?? "",
      ip        : payload.ip ?? "",
    });
  } catch (err) {
    // Fail silently — audit logging must never crash the UI
    console.warn("[AuditLogger] Failed to write log:", err);
  }
}

/**
 * Convenience wrappers for common event categories
 */

export const AuditLogger = {
  /** Authentication events — login, PIN change, lockout auth */
  auth: (event: string, status: LogStatus, details?: string) =>
    writeAuditLog({ event, status, category: "auth", details }),

  /** System configuration changes — settings saved, policy updated */
  config: (event: string, status: LogStatus, details?: string) =>
    writeAuditLog({ event, status, category: "config", details }),

  /** Access events — screen link, pairing, dashboard navigation */
  access: (event: string, status: LogStatus, details?: string) =>
    writeAuditLog({ event, status, category: "access", details }),

  /** Emergency lockout — panic lock initiated / terminated */
  lockout: (event: string, status: LogStatus, details?: string) =>
    writeAuditLog({ event, status, category: "lockout", details }),

  /** General system events — startup, sync, flush */
  system: (event: string, status: LogStatus, details?: string) =>
    writeAuditLog({ event, status, category: "system", details }),

  /** Illegal / unauthorized attempts */
  blocked: (event: string, details?: string) =>
    writeAuditLog({ event, status: "Blocked", category: "access", details }),
};
