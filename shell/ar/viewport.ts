/**
 * KI-DE — AR Viewport System
 * 
 * Augmented Reality als natürliche Erweiterung des Desktops.
 * Jedes Widget kann auf eine AR-Brille projiziert werden.
 * Jedes AR-Gerät ist ein Viewport — genau wie ein Monitor.
 * 
 * Architektur:
 * 
 *   Monitor 1          Monitor 2          AR Brille
 *   ┌─────────┐       ┌─────────┐       ┌─────────┐
 *   │ Browser │       │ Terminal│       │ HUD:    │
 *   │ Editor  │       │ Debug   │       │  Timer  │
 *   │ Files   │       │         │       │  Notif  │
 *   └─────────┘       └─────────┘       │  Info   │
 *       ↑                 ↑              └────↑────┘
 *       └─────────────────┴──────────────────┘
 *                         │
 *                   Scene Graph
 *                   (Widget-Baum)
 *                         │
 *                   KI Command Bridge
 *                   "Zeig das auf der Brille"
 * 
 * KI-DE behandelt AR-Brillen wie Monitore:
 * - "Verschieb das auf die Brille" = wie "Verschieb das auf Monitor 2"
 * - Widgets filtern sich selbst nach RenderTarget
 * - Voice Commands kommen als Input Events zurück
 * 
 * Unterstützte Geräte (Phase 1: WebXR):
 * - Meta Quest (Browser)
 * - Apple Vision Pro (Safari WebXR)
 * - Vuzix (Android WebView)
 * - RealWear (Android WebView)
 * - Jede WebXR-fähige Brille
 * 
 * Unterstützte Geräte (Phase 2: Native):
 * - Custom Android-App für AR Glasses
 * - Companion App für Vision Pro
 */

// ============================================
// AR Device Types
// ============================================

export type ARDeviceType = 
    | 'webxr'           // Browser-basiert (Quest, Vision Pro)
    | 'android_glasses'  // Android-basierte Brillen
    | 'vuzix'           // Vuzix Blade / Shield
    | 'realwear'        // RealWear HMT / Navigator
    | 'vision_pro'      // Apple Vision Pro (native)
    | 'custom';         // Eigene Hardware

export type ARCapability = 
    | 'display'         // Kann Content anzeigen
    | 'camera'          // Hat Kamera
    | 'voice_input'     // Sprachsteuerung
    | 'hand_tracking'   // Handgesten-Erkennung
    | 'eye_tracking'    // Blickverfolgung
    | 'spatial_anchor'  // Räumliche Anker
    | 'passthrough'     // Durchsicht (AR, nicht VR)
    | 'haptics'         // Haptisches Feedback
    | '6dof';           // 6 Degrees of Freedom

export interface ARDevice {
    id: string;
    name: string;
    type: ARDeviceType;
    capabilities: ARCapability[];
    connection: 'webxr' | 'websocket' | 'webrtc' | 'bluetooth';
    resolution: { width: number; height: number };
    fieldOfView?: number;           // in Grad
    refreshRate?: number;           // Hz
    batteryLevel?: number;          // 0-100
    status: 'connected' | 'disconnected' | 'pairing' | 'error';
}


// ============================================
// AR Viewport (= wie ein Monitor)
// ============================================

export interface ARViewport {
    id: string;
    device: ARDevice;
    layout: ARLayout;
    widgets: string[];              // Widget-IDs die hier angezeigt werden
    theme: 'hud' | 'transparent' | 'solid' | 'glass';
    opacity: number;                // 0-1
    position: ARPosition;
    locked: boolean;                // Position fixiert
    followGaze: boolean;            // Folgt dem Blick
}

export type ARLayout = 
    | 'hud'             // Head-Up Display (fixiert im Sichtfeld)
    | 'anchored'        // An realer Position verankert
    | 'floating'        // Schwebt im Raum
    | 'billboard'       // Zeigt immer zum User
    | 'panel';          // Flaches Panel (wie ein virtueller Monitor)

export interface ARPosition {
    // Relativ zum Kopf (HUD) oder zur Welt (anchored)
    x: number;          // Links/Rechts (Meter)
    y: number;          // Oben/Unten (Meter)
    z: number;          // Vor/Zurück (Meter)
    rotX?: number;      // Neigung
    rotY?: number;      // Drehung
    scale?: number;     // Skalierung (1 = normal)
}


// ============================================
// HUD Elements (für AR-Brillen)
// ============================================

export type HUDElementType =
    | 'text'            // Einfacher Text
    | 'notification'    // Benachrichtigung
    | 'timer'           // Countdown/Timer
    | 'status_bar'      // System-Status (Akku, WLAN, etc.)
    | 'progress'        // Fortschrittsbalken
    | 'badge'           // Kleines Icon mit Zahl
    | 'card'            // Daten-Karte
    | 'list'            // Liste
    | 'image'           // Bild/Overlay
    | 'minimap'         // Miniatur-Ansicht
    | 'compass'         // Richtungsanzeige
    | 'pointer';        // Zeiger auf reales Objekt

export interface HUDElement {
    id: string;
    type: HUDElementType;
    position: 'top-left' | 'top-center' | 'top-right' | 
              'center-left' | 'center' | 'center-right' |
              'bottom-left' | 'bottom-center' | 'bottom-right';
    priority: 'low' | 'normal' | 'high' | 'critical';
    content: Record<string, unknown>;
    visible: boolean;
    expiresAt?: number;             // Unix timestamp, auto-hide
    animateIn?: 'fade' | 'slide' | 'scale';
}


// ============================================
// Voice Commands (AR Input)
// ============================================

export interface VoiceCommand {
    raw: string;                    // Rohtext
    intent: string;                 // Erkannter Intent
    entities: Record<string, string>; // Extrahierte Entitäten
    confidence: number;             // 0-1
    requiresConfirmation: boolean;
    source: 'voice' | 'gesture' | 'gaze' | 'controller';
}

export interface VoiceCommandResult {
    success: boolean;
    command: VoiceCommand;
    response?: string;              // Sprach-Antwort
    actions?: ARAction[];           // Ausgelöste Aktionen
    error?: string;
}


// ============================================
// AR Actions (was die KI tun kann)
// ============================================

export type ARAction = 
    | { type: 'show_widget'; widgetId: string; viewport?: string }
    | { type: 'hide_widget'; widgetId: string }
    | { type: 'move_widget'; widgetId: string; viewport: string }
    | { type: 'update_hud'; element: HUDElement }
    | { type: 'clear_hud' }
    | { type: 'navigate'; target: string }
    | { type: 'speak'; text: string }
    | { type: 'highlight'; target: string; color?: string }
    | { type: 'anchor'; widgetId: string; worldPosition: ARPosition }
    | { type: 'follow_gaze'; widgetId: string; enabled: boolean }
    | { type: 'notification'; title: string; text: string; priority: HUDElement['priority'] }
    | { type: 'set_opacity'; viewport: string; opacity: number }
    | { type: 'screenshot' }
    | { type: 'record_start' }
    | { type: 'record_stop' };


// ============================================
// AR Voice Command Patterns (DE + EN)
// ============================================

export const AR_COMMAND_PATTERNS: Array<{
    pattern: RegExp;
    intent: string;
    extract?: (match: RegExpMatchArray) => Record<string, string>;
}> = [
    // Widget Management
    { pattern: /^(?:zeig|show)\s+(.+)\s+(?:auf der brille|on glasses|in ar)$/i,
      intent: 'show_in_ar',
      extract: (m) => ({ widget: m[1] }) },
    
    { pattern: /^(?:versteck|hide|weg mit)\s+(.+)$/i,
      intent: 'hide_widget',
      extract: (m) => ({ widget: m[1] }) },
    
    // Navigation
    { pattern: /^(?:öffne|open)\s+(.+)$/i,
      intent: 'open_app',
      extract: (m) => ({ app: m[1] }) },
    
    { pattern: /^(?:schließe?|close)\s+(.+)$/i,
      intent: 'close_app',
      extract: (m) => ({ app: m[1] }) },
    
    // HUD
    { pattern: /^(?:timer|stoppuhr)\s+(\d+)\s*(?:min(?:uten)?|sek(?:unden)?|s)?$/i,
      intent: 'start_timer',
      extract: (m) => ({ duration: m[1], unit: m[2] || 'min' }) },
    
    { pattern: /^(?:notiz|note|merke)\s+(.+)$/i,
      intent: 'add_note',
      extract: (m) => ({ text: m[1] }) },
    
    // Layout
    { pattern: /^(?:größer|bigger|zoom in)$/i,
      intent: 'zoom_in' },
    
    { pattern: /^(?:kleiner|smaller|zoom out)$/i,
      intent: 'zoom_out' },
    
    { pattern: /^(?:fixier|pin|lock)$/i,
      intent: 'lock_position' },
    
    { pattern: /^(?:löse?|unpin|unlock)$/i,
      intent: 'unlock_position' },
    
    // System
    { pattern: /^(?:screenshot|foto|capture)$/i,
      intent: 'screenshot' },
    
    { pattern: /^(?:aufnahme|record)\s+(?:start|an)$/i,
      intent: 'record_start' },
    
    { pattern: /^(?:aufnahme|record)\s+(?:stop|aus|ende)$/i,
      intent: 'record_stop' },
    
    { pattern: /^(?:dunkel|dark mode|nachtmodus)$/i,
      intent: 'theme_dark' },
    
    { pattern: /^(?:hell|light mode|tagmodus)$/i,
      intent: 'theme_light' },
    
    { pattern: /^(?:transparenter?|durchsichtig(?:er)?)$/i,
      intent: 'increase_opacity' },
    
    { pattern: /^(?:solider?|undurchsichtig(?:er)?)$/i,
      intent: 'decrease_opacity' },
    
    // Meta
    { pattern: /^(?:hilfe|help|befehle|commands)$/i,
      intent: 'help' },
    
    { pattern: /^(?:status|system)$/i,
      intent: 'system_status' },
];


// ============================================
// AR Session Manager
// ============================================

export class ARSessionManager {
    private devices: Map<string, ARDevice> = new Map();
    private viewports: Map<string, ARViewport> = new Map();
    private hudElements: Map<string, HUDElement> = new Map();
    private listeners: Map<string, Set<Function>> = new Map();

    // ---- Device Management ----

    registerDevice(device: ARDevice): ARViewport {
        this.devices.set(device.id, device);
        
        // Create default viewport for this device
        const viewport: ARViewport = {
            id: `vp-${device.id}`,
            device,
            layout: 'hud',
            widgets: [],
            theme: 'glass',
            opacity: 0.85,
            position: { x: 0, y: 0, z: -1.5 },
            locked: false,
            followGaze: false,
        };
        this.viewports.set(viewport.id, viewport);
        
        this.emit('device_connected', { device, viewport });
        return viewport;
    }

    disconnectDevice(deviceId: string): void {
        const device = this.devices.get(deviceId);
        if (!device) return;
        
        device.status = 'disconnected';
        
        // Remove viewport
        for (const [vpId, vp] of this.viewports) {
            if (vp.device.id === deviceId) {
                this.viewports.delete(vpId);
            }
        }
        
        this.emit('device_disconnected', { device });
    }

    // ---- Widget Routing ----

    showWidgetOnAR(widgetId: string, viewportId?: string): void {
        const vp = viewportId 
            ? this.viewports.get(viewportId) 
            : this.getDefaultViewport();
        
        if (!vp) throw new Error('Kein AR-Viewport verfügbar');
        if (!vp.widgets.includes(widgetId)) {
            vp.widgets.push(widgetId);
        }
        
        this.emit('widget_shown', { widgetId, viewport: vp });
    }

    hideWidgetOnAR(widgetId: string): void {
        for (const vp of this.viewports.values()) {
            vp.widgets = vp.widgets.filter(id => id !== widgetId);
        }
        this.emit('widget_hidden', { widgetId });
    }

    moveWidgetToAR(widgetId: string, fromViewport: string, toViewport: string): void {
        const from = this.viewports.get(fromViewport);
        const to = this.viewports.get(toViewport);
        if (from) from.widgets = from.widgets.filter(id => id !== widgetId);
        if (to && !to.widgets.includes(widgetId)) to.widgets.push(widgetId);
        
        this.emit('widget_moved', { widgetId, from: fromViewport, to: toViewport });
    }

    // ---- HUD Management ----

    updateHUD(element: HUDElement): void {
        this.hudElements.set(element.id, element);
        this.emit('hud_updated', { element });
    }

    removeHUDElement(elementId: string): void {
        this.hudElements.delete(elementId);
        this.emit('hud_removed', { elementId });
    }

    clearHUD(): void {
        this.hudElements.clear();
        this.emit('hud_cleared', {});
    }

    getHUDElements(): HUDElement[] {
        return [...this.hudElements.values()].filter(e => e.visible);
    }

    // ---- Voice Commands ----

    processVoiceCommand(raw: string, confidence: number = 1.0): VoiceCommandResult {
        const command: VoiceCommand = {
            raw,
            intent: 'unknown',
            entities: {},
            confidence,
            requiresConfirmation: confidence < 0.8,
            source: 'voice',
        };

        // Match against patterns
        for (const { pattern, intent, extract } of AR_COMMAND_PATTERNS) {
            const match = raw.match(pattern);
            if (match) {
                command.intent = intent;
                if (extract) command.entities = extract(match);
                break;
            }
        }

        // Execute
        const actions = this.intentToActions(command);
        
        this.emit('voice_command', { command, actions });
        
        return {
            success: command.intent !== 'unknown',
            command,
            actions,
            response: command.intent === 'unknown' 
                ? 'Befehl nicht erkannt. Sage "Hilfe" für verfügbare Befehle.'
                : undefined,
        };
    }

    private intentToActions(command: VoiceCommand): ARAction[] {
        switch (command.intent) {
            case 'show_in_ar':
                return [{ type: 'show_widget', widgetId: command.entities.widget || '' }];
            case 'hide_widget':
                return [{ type: 'hide_widget', widgetId: command.entities.widget || '' }];
            case 'open_app':
                return [{ type: 'navigate', target: command.entities.app || '' }];
            case 'screenshot':
                return [{ type: 'screenshot' }];
            case 'record_start':
                return [{ type: 'record_start' }];
            case 'record_stop':
                return [{ type: 'record_stop' }];
            case 'start_timer':
                return [{ type: 'update_hud', element: {
                    id: `timer-${Date.now()}`,
                    type: 'timer',
                    position: 'top-right',
                    priority: 'normal',
                    content: { duration: parseInt(command.entities.duration || '5'), unit: command.entities.unit },
                    visible: true,
                    animateIn: 'fade',
                }}];
            case 'add_note':
                return [{ type: 'notification', title: 'Notiz', text: command.entities.text || '', priority: 'normal' }];
            case 'help':
                return [{ type: 'speak', text: 'Verfügbare Befehle: Öffne App, Zeig Widget auf der Brille, Timer, Screenshot, Notiz, Hilfe' }];
            case 'system_status':
                return [{ type: 'speak', text: `${this.devices.size} Geräte verbunden, ${this.viewports.size} Viewports aktiv` }];
            default:
                return [];
        }
    }

    // ---- Helpers ----

    getDefaultViewport(): ARViewport | undefined {
        return [...this.viewports.values()][0];
    }

    getDevices(): ARDevice[] {
        return [...this.devices.values()];
    }

    getViewports(): ARViewport[] {
        return [...this.viewports.values()];
    }

    // ---- Events ----

    on(event: string, fn: Function): () => void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(fn);
        return () => this.listeners.get(event)?.delete(fn);
    }

    private emit(event: string, data: any): void {
        this.listeners.get(event)?.forEach(fn => {
            try { fn(data); } catch (e) { console.error(`[AR] Event handler error:`, e); }
        });
    }
}
