# openPlank OS 🐧

**Das KI Desktop Environment für Arztpraxen.**

> KDE = K Desktop Environment.
> openPlank = **KI** Desktop Environment.

Eine Linux-Distribution, die openPlank als nativen Desktop nutzt. Kein Browser-Tab. Kein Windows. Rechner an → Praxis läuft.

## Vision

```
┌──────────────────────────────────────────────────┐
│                 openPlank OS                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Patienten │  │ Röntgen  │  │ Termine  │      │
│  │           │  │          │  │          │      │
│  │  Widget   │  │  Widget  │  │  Widget  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  🎤 "Öffne Patientenakte Müller neben Röntgen"  │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │        KI Command Bar                  │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

## Was ist das?

openPlank OS ist eine Debian-basierte Linux-Distribution, die:

- **Direkt in openPlank bootet** — kein klassischer Desktop, kein Browser
- **KI als Window Manager** nutzt — Sprache & Text steuern das Layout
- **Multi-Screen nativ** unterstützt — Tablet, Wandmonitor, Smartglass = Viewports
- **Zero-Config** ist — USB-Stick rein, installieren, Praxis läuft
- **Unkaputtbar** ist — Read-Only Root, Auto-Recovery, OTA-Updates

## Architektur

```
┌─────────────────────────────────────────┐
│            openPlank KI-DE              │  ← KI Desktop Environment
├─────────────────────────────────────────┤
│  Scene Graph  │  Bridge  │  Widgets     │  ← openPlank Core
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
| KI-DE | openPlank Scene Graph + Bridge | 🟢 Existiert |
| UI Rendering | Chromium Kiosk (Phase 1) → Native (Phase 3) | 🟡 Phase 1 |
| KI Engine | Ollama (lokal) | 🟢 Funktioniert |
| Datenbank | PostgreSQL | 🟢 Funktioniert |

## Phasen

### Phase 1: Kiosk-Distro (MVP) 🎯
Schnellster Weg zu einem bootbaren System:
- Debian Minimal + Auto-Login
- Chromium Kiosk → `localhost:3001`
- PostgreSQL + Node.js + openPlank vorinstalliert
- Ollama optional vorinstalliert
- Setup-Wizard beim ersten Boot
- **Ziel:** USB-Stick → 10min Install → Praxis läuft

### Phase 2: Eigener Session Manager
- Wayland-Compositor auf wlroots (`planktop`)
- Scene Graph steuert Fenster-Layout
- KI Bridge über D-Bus statt HTTP
- Widgets = Wayland Surfaces oder WebViews
- Multi-Monitor nativ

### Phase 3: KI Window Manager
- Sprachsteuerung als primärer Input
- KI arrangiert Fenster automatisch
- Drag & Drop zwischen Screens
- OTA-Updates (A/B-Partitionen)
- Appliance-Mode (unkaputtbar)

## Quick Start (Phase 1)

### ISO bauen
```bash
# Voraussetzungen (Debian/Ubuntu)
sudo apt install live-build debootstrap

# ISO bauen
cd iso/
sudo lb config
sudo lb build

# Ergebnis: iso/live-image-amd64.hybrid.iso
```

### In VM testen
```bash
# Mit QEMU
qemu-system-x86_64 -m 4096 -cdrom iso/live-image-amd64.hybrid.iso -enable-kvm

# Oder mit VirtualBox / VMware
```

### Auf USB-Stick schreiben
```bash
sudo dd if=iso/live-image-amd64.hybrid.iso of=/dev/sdX bs=4M status=progress
```

## Praxis-Szenario

1. 🖥️ Zahnarzt kauft Mini-PC (300€)
2. 💾 USB-Stick rein, openPlank OS installieren (10 Min)
3. 🚀 Rechner startet → Setup-Wizard (Praxisname, Drucker, Netzwerk)
4. ✅ Fertig. Praxis läuft.
5. 📱 Tablet ins WLAN → verbindet sich automatisch
6. 🖥️ Wandmonitor anschließen → zeigt Wartezimmer-Info
7. 🎤 "Hey Plank, zeig mir die Termine für heute"

## Struktur

```
openplank-os/
├── iso/                    # Live-Build Konfiguration
│   ├── config/             # Debian live-build config
│   ├── hooks/              # Build-Hooks (Post-Install Scripts)
│   ├── packages/           # Paketlisten
│   └── branding/           # Plymouth, Wallpaper, Icons
├── compositor/             # planktop — Wayland Compositor (Phase 2)
│   ├── src/                # C/Rust Compositor Code
│   └── protocols/          # Wayland Protocol Extensions
├── session/                # Session Manager
│   ├── src/                # Session/Login Manager
│   └── configs/            # Autostart, D-Bus, systemd
├── kide/                   # KI Desktop Environment
│   ├── widgets/            # Native Widget Definitionen
│   ├── themes/             # Desktop Themes
│   └── dbus/               # D-Bus Interface für KI Bridge
├── scripts/                # Build & Setup Scripts
├── docs/                   # Dokumentation
└── assets/                 # Logos, Wallpapers, Icons
```

## Verwandte Repos

- [openplank](https://github.com/openplank-dev/openplank) — Dachmarke
- [openplank-dent](https://github.com/openplank-dev/openplank-dent) — Zahnarztpraxen
- [openplank-med](https://github.com/openplank-dev/openplank-med) — Allgemeinmedizin

## Lizenz

MIT — Open Source, für immer.

---

*"Kein Windows. Kein macOS. Kein IT-Typ nötig. Einfach Praxis."*
