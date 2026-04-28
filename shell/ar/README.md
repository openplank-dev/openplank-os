# KI-DE — AR Viewport System

> AR-Brillen als natürliche Erweiterung des Desktops

## Konzept

In KI-DE ist eine AR-Brille einfach ein weiterer Viewport — wie ein zweiter Monitor, nur im Raum.

```
                    ┌───────────────────────────────────────┐
                    │           KI-DE Scene Graph            │
                    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
                    │  │Timer│ │Files│ │Term │ │Note │   │
                    │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘   │
                    └─────┼───────┼───────┼───────┼───────┘
                          │       │       │       │
            ┌─────────────┤       │       │       │
            ▼             ▼       ▼       │       ▼
    ┌──────────┐  ┌──────────┐  ┌──┴───┐  │  ┌──────┐
    │ AR Brille│  │ Monitor 1│  │Mon 2 │  │  │Tablet│
    │ (HUD)    │  │ (Desktop)│  │      │  │  │      │
    │  Timer   │  │  Files   │  │ Term │  │  │ Note │
    └──────────┘  └──────────┘  └──────┘  │  └──────┘
                                          │
                                    (nicht zugewiesen)
```

## Wie es funktioniert

### Für den User
```
User: "Zeig den Timer auf der Brille"
→ Widget wird auf AR-Viewport geroutet
→ Brille zeigt Timer als HUD-Element

User: "Notiz: Termin um 15 Uhr"
→ Notiz erscheint als HUD-Badge
→ Auto-hide nach 8 Sekunden

User: "Screenshot"
→ AR-Aufnahme wird gespeichert
```

### Für Entwickler
```typescript
import { ARSessionManager } from './viewport';

const ar = new ARSessionManager();

// Gerät registrieren
const viewport = ar.registerDevice({
    id: 'my-glasses',
    name: 'Quest 3',
    type: 'webxr',
    capabilities: ['display', 'camera', 'voice_input', '6dof'],
    connection: 'webxr',
    resolution: { width: 2064, height: 2208 },
});

// Widget auf AR zeigen
ar.showWidgetOnAR('timer-widget', viewport.id);

// HUD-Element setzen
ar.updateHUD({
    id: 'status',
    type: 'status_bar',
    position: 'top-left',
    priority: 'low',
    content: { items: [
        { icon: '🔋', value: '87%' },
        { icon: '📶', value: 'WiFi' },
        { icon: '⏱', value: '14:30' },
    ]},
    visible: true,
});

// Voice Command verarbeiten
const result = ar.processVoiceCommand("Öffne Terminal", 0.95);
```

## Unterstützte Geräte

| Gerät | Phase | Verbindung |
|-------|-------|------------|
| Meta Quest 2/3/Pro | Phase 1 | WebXR (Browser) |
| Apple Vision Pro | Phase 1 | WebXR (Safari) |
| Android AR (ARCore) | Phase 1 | WebXR (Chrome) |
| Vuzix Blade/Shield | Phase 2 | Android WebView |
| RealWear HMT/Nav | Phase 2 | Android WebView |
| Custom Hardware | Phase 3 | Native App |

## Voice Commands

| Befehl (DE) | Befehl (EN) | Aktion |
|-------------|-------------|--------|
| "Zeig X auf der Brille" | "Show X on glasses" | Widget → AR |
| "Versteck X" | "Hide X" | Widget ausblenden |
| "Öffne Terminal" | "Open terminal" | App starten |
| "Timer 5 Minuten" | "Timer 5 minutes" | HUD-Timer |
| "Screenshot" | "Screenshot" | Aufnahme |
| "Notiz: Text" | "Note: Text" | HUD-Notiz |
| "Größer / Kleiner" | "Bigger / Smaller" | Zoom |
| "Fixier" | "Pin" | Position sperren |
| "Dark Mode" | "Dark Mode" | Theme wechseln |
| "Hilfe" | "Help" | Befehlsliste |

## Dateien

```
shell/ar/
├── viewport.ts         — AR Device/Viewport/HUD/Voice Types + SessionManager
├── webxr-client.ts     — WebXR Browser Client (läuft auf der Brille)
└── README.md           — Diese Datei
```

## Architektur-Entscheidungen

1. **AR = Viewport, nicht Sondermodus** — Kein spezieller "AR-Modus", die Brille ist einfach ein Viewport wie ein Monitor
2. **WebXR-first** — Maximale Kompatibilität, läuft im Browser der Brille
3. **DOM-Overlay Phase 1** — HUD-Rendering via DOM (einfach, schnell). Phase 3: WebGL
4. **Voice-first Input** — AR-Brillen haben meist keine Tastatur, Voice ist der primäre Input
5. **Generisch** — Keine Domain-spezifischen HUD-Elemente. Apps (openplank-dent, etc.) definieren ihre eigenen AR-Widgets
