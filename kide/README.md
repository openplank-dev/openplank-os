# KI-DE — KI Desktop Environment

> Das Herzstück von openPlank OS

## Was ist KI-DE?

KI-DE (KI Desktop Environment) ist die Desktop-Schicht von openPlank OS. Statt eines klassischen Window Managers steuert eine KI das Layout, die Navigation und die Fensteranordnung.

## Kernkomponenten

### 1. Scene Graph (aus openPlank Core)
Jedes UI-Element ist ein Widget im Scene Graph:
```typescript
interface Widget {
    id: string;
    type: 'patient-card' | 'appointment-list' | 'xray-viewer' | ...;
    renderTarget: 'main' | 'tablet-1' | 'wall-display' | 'smartglass';
    position: { x: number, y: number, z: number };
    size: { width: number, height: number };
    permissions: string[];
}
```

### 2. KI Command Bridge (aus openPlank Core)
Natürlichsprachliche Befehle werden zu UI-Aktionen:
```
"Öffne Patientenakte Müller"     → navigate:patients + filter:Müller
"Röntgenbild daneben zeigen"     → layout:split + show:xray-viewer
"Auf den Wandmonitor verschieben" → move:widget → renderTarget:wall
"Dunkles Theme"                   → theme:dark
```

### 3. Viewport Manager (NEU)
Jeder Bildschirm ist ein Viewport:
```
┌──────────────────┐  ┌──────────────┐  ┌──────────┐
│   Hauptmonitor   │  │    Tablet    │  │  Wand    │
│  (Behandlung)    │  │ (Assistenz)  │  │(Wartezim)│
│                  │  │              │  │          │
│  viewport:main   │  │ viewport:t1  │  │viewport:w│
└──────────────────┘  └──────────────┘  └──────────┘
          ↕ Drag & Drop zwischen Viewports ↕
```

### 4. Voice Engine (Phase 3)
```
Mikrofon → STT → KI Bridge → Widget Actions → TTS Feedback
    🎤        📝        🧠           🖥️           🔊
```

## Widget-Typen

| Widget | Beschreibung | Verfügbar |
|--------|-------------|-----------|
| `patient-card` | Patientenakte (Stammdaten, Allergien) | ✅ |
| `appointment-list` | Terminliste/Tagesansicht | ✅ |
| `xray-viewer` | Röntgenbilder (DICOM) | 🔴 |
| `treatment-plan` | Behandlungsplan/HKP | 🔴 |
| `billing-view` | Abrechnung (BEMA/GOZ) | 🔴 |
| `waiting-room` | Wartezimmer-Display | 🟡 |
| `ki-assistant` | KI-Chat Panel | ✅ |
| `calendar-week` | Wochenkalender | 🔴 |
| `lab-results` | Laborergebnisse | 🔴 |
| `document-viewer` | PDF/Briefe | 🔴 |
| `camera-feed` | Intraoral-Kamera | 🔴 |
| `vitals-monitor` | Vitalwerte (Puls, BP) | 🔴 |

## Themes

```css
/* Theme: Duality (Default) */
:root[data-theme="duality"] {
    --bg-primary: #F8FAFC;
    --bg-secondary: #FFFFFF;
    --accent: #5B9AA0;
    --text-primary: #1E293B;
}

/* Theme: Dark */
:root[data-theme="dark"] {
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --accent: #5B9AA0;
    --text-primary: #F8FAFC;
}

/* Theme: Dampsoft (Legacy) */
:root[data-theme="dampsoft"] {
    --bg-primary: #003366;
    --bg-secondary: #FFFFFF;
    --accent: #FF8C00;
    --text-primary: #333333;
}
```

## Status

- ✅ Scene Graph + Widget Registry
- ✅ KI Command Bridge (10 Actions)
- ✅ Theme Engine (4 Themes)
- 🟡 Viewport Manager (Multi-Screen Konzept)
- 🔴 Voice Engine
- 🔴 Native Widgets (aktuell Web-based)
