/**
 * KI-DE Shared Context
 * 
 * Generisches System zum Teilen von Objekten zwischen Viewports/Screens.
 * Nicht domänenspezifisch — funktioniert mit beliebigen Objekten.
 * 
 * Beispiele:
 *   { type: "file", id: "/home/user/doc.pdf", data: { name: "doc.pdf" } }
 *   { type: "url", id: "https://...", data: { title: "Wikipedia" } }
 *   { type: "clipboard", id: "clip-1", data: { text: "Hello" } }
 *   { type: "widget", id: "widget-42", data: { widgetType: "app-window" } }
 *   { type: "selection", id: "sel-1", data: { text: "selected text" } }
 */

export interface SharedObject {
  type: string;                        // Beliebiger Typ
  id: string;                          // Eindeutige ID
  data?: Record<string, any>;          // Optionale Zusatzdaten
  mimeType?: string;                   // Optional: MIME-Type
}

export type FollowMode = 'follow' | 'observe' | 'none';
// follow  = Viewport zeigt das Objekt automatisch an
// observe = Viewport zeigt ein Badge/Hinweis, aber navigiert nicht
// none    = Viewport ignoriert diesen Kontext

export interface SharedContextEntry {
  id: string;
  object: SharedObject;
  sharedBy: string;                    // Viewport oder Client ID
  sharedAt: Date;
  viewers: Record<string, FollowMode>; // viewport-id → mode
  expiresAt?: Date;                    // Optional: Auto-Expire
}

// ============================================
// Events
// ============================================

export type SharedContextEvent =
  | { type: 'shared'; entry: SharedContextEntry }
  | { type: 'unshared'; entryId: string }
  | { type: 'updated'; entry: SharedContextEntry }
  | { type: 'viewer-joined'; entryId: string; viewportId: string; mode: FollowMode }
  | { type: 'viewer-left'; entryId: string; viewportId: string };

// ============================================
// D-Bus Interface (Phase 2)
// ============================================

/**
 * org.openplank.SharedContext
 * 
 * Methods:
 *   Share(type: s, id: s, dataJson: s) → entryId: s
 *   Unshare(entryId: s) → success: b
 *   SetMode(entryId: s, viewportId: s, mode: s) → success: b
 *   List() → entriesJson: s
 *   ListByType(type: s) → entriesJson: s
 * 
 * Signals:
 *   ObjectShared(entryJson: s)
 *   ObjectUnshared(entryId: s)
 *   ObjectUpdated(entryJson: s)
 */
