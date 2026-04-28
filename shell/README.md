# KI-DE Shell

> Die Desktop-Shell des KI Desktop Environments

## Kernkomponenten

### 1. Scene Graph
Jedes UI-Element ist ein adressierbarer Knoten im Baum:
```typescript
interface Widget {
    id: string;
    type: string;                    // 'app-window' | 'panel' | 'notification' | 'overlay' | ...
    viewport: string;                // Welcher Screen zeigt dieses Widget
    position: { x, y, z: number };   // z = Stacking Order
    size: { width, height: number };
    state: 'visible' | 'minimized' | 'maximized' | 'hidden';
    permissions: string[];
    children?: Widget[];
}
```

### 2. KI Command Bridge
Natürlichsprachliche Befehle → Desktop-Aktionen:
```
"Öffne Firefox"                     → launch:firefox
"Leg das neben den Editor"          → layout:split-right + move:widget
"Auf den zweiten Monitor"           → viewport:move → screen-2
"Mach das Fenster größer"           → resize:grow
"Dunkles Theme"                     → theme:dark
"Zeig mir alle offenen Fenster"     → overview:show
```

### 3. Shared Context
Objekte zwischen Viewports/Screens teilen:
```
┌──────────────────┐  ┌──────────────┐  ┌──────────┐
│   Laptop Screen  │  │   Tablet     │  │ Projektor│
│  (viewport:main) │  │ (viewport:t1)│  │(viewport:p)│
└──────────────────┘  └──────────────┘  └──────────┘
         ↕ Shared Context: Drag & Drop ↕
```

### 4. Theme Engine
CSS-Token-basiert, live umschaltbar:
```css
:root[data-theme="light"] {
    --bg-primary: #F8FAFC;
    --accent: #5B9AA0;
}
:root[data-theme="dark"] {
    --bg-primary: #0F172A;
    --accent: #5B9AA0;
}
```

### 5. Panels
- **Taskbar** — Laufende Apps, System-Tray, Uhr
- **Launcher** — App-Starter (KI-gesteuert oder klassisch)
- **Notifications** — Desktop-Benachrichtigungen
- **Command Bar** — Eingabefeld für KI-Befehle (wie Spotlight/Alfred, aber KI)

## Widget-Typen

| Widget | Beschreibung |
|--------|-------------|
| `app-window` | Fenster einer laufenden App |
| `panel-taskbar` | Taskleiste (unten/oben) |
| `panel-launcher` | App-Launcher |
| `overlay-notification` | Benachrichtigung |
| `overlay-command-bar` | KI Command Bar |
| `split-container` | Tiling-Container (links/rechts/oben/unten) |
| `workspace` | Virtueller Desktop |
| `viewport` | Physischer Screen |
