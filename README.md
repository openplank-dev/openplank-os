# openPlank OS 🐧

**KI-DE — Das KI Desktop Environment.**

> KDE = K Desktop Environment.
> KI-DE = **KI** Desktop Environment.

Ein Linux Desktop Environment, bei dem KI der Window Manager ist. Nicht eine App mit KI-Features — ein komplettes Desktop, gesteuert durch natürliche Sprache und intelligentes Layout.

## Vision

```
┌──────────────────────────────────────────────────┐
│                  openPlank KI-DE                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Browser  │  │  Editor  │  │  Dateien │      │
│  │           │  │          │  │          │      │
│  │  Widget   │  │  Widget  │  │  Widget  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  🎤 "Leg den Editor neben den Browser"           │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │        KI Command Bar                  │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

## Was ist das?

KI-DE ist ein Wayland-basiertes Linux Desktop Environment, das:

- **KI als Window Manager** nutzt — Sprache & Text steuern das Layout
- **Multi-Screen nativ** unterstützt — jeder Monitor ist ein Viewport
- **Apps als Widgets** behandelt — jedes Fenster ist addressierbar, steuerbar, teilbar
- **Shared Context** hat — Objekte zwischen Screens teilen (Drag von Laptop auf Wandmonitor)
- **Theme Engine** mitbringt — CSS-Token-basiert, live umschaltbar
- **Zero-Config** möglich — als Linux-Distro: booten und loslegen

## Architektur

```
┌─────────────────────────────────────────┐
│            Anwendungen (Apps)           │  ← Beliebige Apps laufen auf KI-DE
├─────────────────────────────────────────┤
│         KI-DE Desktop Shell             │  ← Widget Registry, Themes, Panels
├─────────────────────────────────────────┤
│  Scene Graph  │  Bridge  │  Shared Ctx  │  ← Core: Adressierbarer UI-Baum
├─────────────────────────────────────────┤
│         planktop (Compositor)           │  ← Wayland Compositor
├─────────────────────────────────────────┤
│              wlroots                    │  ← Wayland Library
├─────────────────────────────────────────┤
│         Linux Kernel (Debian)           │  ← OS Base
└─────────────────────────────────────────┘
```

| Schicht | Technologie | Status |
|---------|-------------|--------|
| OS Base | Debian 12 (Bookworm) | 🟢 Stabil |
| Display | Wayland (wlroots) | 🟡 Phase 2 |
| Compositor | planktop | 🔴 Geplant |
| Desktop Shell | KI-DE (Scene Graph + Bridge) | 🟡 Prototyp |
| KI Engine | Ollama (lokal) / OpenAI-kompatibel | 🟢 Funktioniert |
| Rendering | Chromium Kiosk (Phase 1) → Native (Phase 3) | 🟡 Phase 1 |

## Phasen

### Phase 1: Kiosk-Shell (MVP) 🎯
- Debian Minimal + Auto-Login
- Chromium Kiosk als Shell (wie ChromeOS)
- Scene Graph + Widget Registry
- KI Command Bridge (natürlichsprachliche Befehle → UI-Aktionen)
- Theme Engine (live umschaltbar)
- Shared Context (Objekte zwischen Viewports teilen)
- **Ziel:** USB-Stick → Install → KI-Desktop

### Phase 2: Wayland Compositor
- Eigener Compositor auf wlroots (`planktop`)
- Apps als Wayland Surfaces
- KI steuert Fenster-Layout über D-Bus
- Multi-Monitor nativ
- Widget ↔ Fenster Mapping

### Phase 3: KI Window Manager
- Sprachsteuerung als primärer Input
- KI arrangiert Fenster automatisch basierend auf Kontext
- Drag & Drop zwischen Screens (Laptop → Projektor → Tablet)
- OTA-Updates (A/B-Partitionen)
- Plugin-System für Desktop-Widgets

## Quick Start

### ISO bauen
```bash
sudo apt install live-build debootstrap
sudo ./scripts/build-iso.sh
```

### In VM testen
```bash
qemu-system-x86_64 -m 4096 -cdrom build/openplank-os.iso -enable-kvm
```

### KI-DE auf bestehendem System
```bash
# Kommt in Phase 2 — apt install openplank-kide
```

## Struktur

```
openplank-os/
├── iso/                    # Live-Build Konfiguration
│   ├── config/             # Debian live-build config
│   ├── hooks/              # Build-Hooks
│   ├── packages/           # Paketlisten
│   └── branding/           # Plymouth, Wallpaper, Icons
├── compositor/             # planktop — Wayland Compositor (Phase 2)
│   ├── src/                # Rust Compositor Code
│   └── protocols/          # Wayland Protocol Extensions
├── shell/                  # KI-DE Desktop Shell
│   ├── scene-graph/        # Widget Registry + Scene Tree
│   ├── bridge/             # KI Command Bridge
│   ├── shared-context/     # Objekt-Sharing zwischen Viewports
│   ├── themes/             # Theme Definitionen
│   └── panels/             # Taskbar, Launcher, Notifications
├── session/                # Session Manager
│   ├── src/                # Login/Session Manager
│   └── configs/            # systemd, D-Bus, Autostart
├── scripts/                # Build & Setup Scripts
├── docs/                   # Dokumentation
└── assets/                 # Logos, Wallpapers, Icons
```

## Apps auf KI-DE

KI-DE ist ein Desktop Environment — jede Linux-App läuft darauf:

```bash
# Beispiele für Apps die auf KI-DE laufen
firefox          # Browser
code             # VS Code
libreoffice      # Office
spotify          # Musik
openplank-dent   # Zahnarzt-Software (separate App)
openplank-med    # Arzt-Software (separate App)
beliebige-app    # Alles was auf Linux läuft
```

Der Unterschied zu GNOME/KDE: **Die KI steuert das Layout.**

```
🎤 "Öffne Firefox neben dem Terminal"
🎤 "Mach den Editor größer"
🎤 "Zeig mir den Dateimanager auf dem zweiten Monitor"
🎤 "Dunkles Theme"
🎤 "Teile dieses Fenster auf den Projektor"
```

## Lizenz

MIT — Open Source, für immer.

---

*"Kein Window Manager den du konfigurierst. Einer der dich versteht."*
