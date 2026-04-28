/**
 * KI-DE Scene Graph — Widget Definition
 * 
 * Jedes Element auf dem Desktop ist ein Widget.
 * Apps, Panels, Notifications, Overlays — alles.
 */

export type WidgetState = 'visible' | 'minimized' | 'maximized' | 'hidden' | 'fullscreen';

export type WidgetType =
  | 'app-window'           // Fenster einer laufenden App
  | 'panel-taskbar'        // Taskleiste
  | 'panel-launcher'       // App-Launcher / Start-Menü
  | 'panel-command-bar'    // KI Command Bar
  | 'overlay-notification' // Benachrichtigung
  | 'overlay-tooltip'      // Tooltip
  | 'split-container'      // Tiling-Container
  | 'workspace'            // Virtueller Desktop
  | 'viewport'             // Physischer Screen
  | 'custom';              // Plugin-Widget

export interface Position {
  x: number;
  y: number;
  z: number;  // Stacking order (höher = weiter vorne)
}

export interface Size {
  width: number;
  height: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
  icon?: string;
  viewport: string;           // Welcher Screen zeigt dieses Widget
  workspace?: string;         // Auf welchem virtuellen Desktop
  position: Position;
  size: Size;
  minSize?: Size;
  maxSize?: Size;
  state: WidgetState;
  resizable: boolean;
  movable: boolean;
  closable: boolean;
  focusable: boolean;
  focused: boolean;
  pinned: boolean;            // Bleibt auf allen Workspaces sichtbar
  opacity: number;            // 0-1
  decorations: boolean;       // Fensterrahmen ja/nein
  metadata?: Record<string, any>;
  children?: Widget[];
  parent?: string;            // Parent Widget ID (für Tiling)
  appId?: string;             // ID der App die dieses Widget besitzt
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scene Graph — Der UI-Baum
 * 
 * Root
 * ├── Viewport "main" (Monitor 1)
 * │   ├── Workspace "default"
 * │   │   ├── app-window "firefox-1"
 * │   │   ├── app-window "terminal-1"
 * │   │   └── split-container
 * │   │       ├── app-window "editor-1"
 * │   │       └── app-window "files-1"
 * │   └── panel-taskbar
 * ├── Viewport "external" (Monitor 2)
 * │   └── Workspace "default"
 * │       └── app-window "presentation-1"
 * └── Viewport "tablet" (Tablet via Netzwerk)
 *     └── app-window "notes-1"
 */

export interface SceneGraph {
  viewports: Map<string, Widget>;  // viewport-id → Viewport Widget
  widgets: Map<string, Widget>;    // widget-id → Widget
  focusStack: string[];            // Widget IDs in Focus-Reihenfolge
  activeViewport: string;
  activeWorkspace: string;
}

// ============================================
// Actions — Was die KI (oder der User) tun kann
// ============================================

export type WidgetAction =
  | { type: 'launch'; app: string; args?: string[] }
  | { type: 'close'; widgetId: string }
  | { type: 'focus'; widgetId: string }
  | { type: 'minimize'; widgetId: string }
  | { type: 'maximize'; widgetId: string }
  | { type: 'restore'; widgetId: string }
  | { type: 'fullscreen'; widgetId: string }
  | { type: 'move'; widgetId: string; position: Partial<Position> }
  | { type: 'resize'; widgetId: string; size: Partial<Size> }
  | { type: 'move-to-viewport'; widgetId: string; viewport: string }
  | { type: 'move-to-workspace'; widgetId: string; workspace: string }
  | { type: 'split'; widgetId: string; direction: 'left' | 'right' | 'top' | 'bottom'; targetId?: string }
  | { type: 'pin'; widgetId: string; pinned: boolean }
  | { type: 'set-opacity'; widgetId: string; opacity: number }
  | { type: 'theme'; themeId: string }
  | { type: 'overview'; show: boolean }
  | { type: 'workspace-switch'; workspace: string }
  | { type: 'command-bar'; show: boolean };
