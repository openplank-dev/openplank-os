# KI-DE — Architektur

## Überblick

```
┌──────────────────────────────────────────────────────────────┐
│                       Benutzer                               │
│            🎤 Sprache   👆 Touch/Maus   ⌨️ Tastatur          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │   Viewport   │  │   Viewport   │  │   Viewport   │     │
│   │  (Monitor 1) │  │  (Monitor 2) │  │   (Tablet)   │     │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│          │                 │                  │              │
│   ┌──────┴─────────────────┴──────────────────┴───────┐     │
│   │              Viewport Manager                      │     │
│   └────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│   ┌────────────────────────┴──────────────────────────┐     │
│   │              Scene Graph (Widget-Baum)              │     │
│   └────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│   ┌──────────┐  ┌─────────┴────────┐  ┌──────────────┐     │
│   │  Theme   │  │   KI Command     │  │   Shared     │     │
│   │  Engine  │  │   Bridge         │  │   Context    │     │
│   └──────────┘  └─────────┬────────┘  └──────────────┘     │
│                           │                                  │
│   ┌──────────────────────┴────────────────────────────┐     │
│   │              KI Engine (Ollama / LLM)              │     │
│   └───────────────────────────────────────────────────┘     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   Compositor: Chromium Kiosk (Phase 1) → planktop (Phase 3) │
├──────────────────────────────────────────────────────────────┤
│   Wayland / X11                                              │
├──────────────────────────────────────────────────────────────┤
│   Linux Kernel (Debian 12)                                   │
├──────────────────────────────────────────────────────────────┤
│   Hardware (PC / Laptop / Mini-PC / Tablet)                  │
└──────────────────────────────────────────────────────────────┘
```

## KI-DE vs. KDE / GNOME

| Eigenschaft | GNOME / KDE | KI-DE |
|-------------|-------------|-------|
| Window Management | Manuell (Drag, Resize, Snap) | KI-gesteuert + manuell |
| App-Start | Klick auf Icon | "Öffne Firefox" oder Klick |
| Layout | User arrangiert Fenster | KI schlägt Layout vor |
| Multi-Screen | Monitor-Settings | KI routet Fenster |
| Sharing | Copy-Paste | Shared Context (Objekt-Sharing) |
| Themes | Settings-Panel | "Dunkles Theme" |
| Konfiguration | GUI / dotfiles | Natürliche Sprache + GUI |

## Boot-Sequenz

```
1. BIOS/UEFI → GRUB → Linux Kernel
2. systemd
   ├── Netzwerk, Audio, etc.
   ├── ollama.service (optionale lokale KI)
   └── getty@tty1 (autologin)
       ↓
3. KI-DE Session
   ├── Phase 1: startx → openbox → chromium --kiosk
   └── Phase 3: planktop (eigener Compositor)
       ↓
4. Desktop Shell
   ├── Taskbar
   ├── Command Bar
   ├── App Launcher
   └── Notification Center
```

## Kommunikationswege

### Phase 1 (Chromium Kiosk)
```
Browser UI ←→ WebSocket ←→ KI-DE Server ←→ Ollama
```

### Phase 2+ (planktop Compositor)
```
Apps ←→ Wayland Protocol ←→ planktop
                                ↕ D-Bus
                           KI-DE Shell
                                ↕
                           KI Engine
```

## Hardware-Anforderungen

### Minimum (ohne lokale KI)
- CPU: x86_64, 2 Kerne
- RAM: 2 GB
- Disk: 8 GB
- GPU: Jede mit KMS-Support

### Empfohlen (mit lokaler KI via Ollama)
- CPU: x86_64, 4+ Kerne
- RAM: 16 GB
- GPU: Optional (NVIDIA/AMD für schnellere Inferenz)
- Disk: 64 GB SSD

### KI-DE ohne lokale KI
KI-DE kann auch mit einem Remote-LLM arbeiten (OpenAI API, eigener Server).
In dem Fall reichen 2 GB RAM.
