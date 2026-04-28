# openPlank OS — Roadmap

## Phase 1: Kiosk-Distro (MVP) 🎯

**Ziel:** Ein bootbares ISO das direkt in openPlank startet.

| Task | Beschreibung | Status |
|------|-------------|--------|
| Debian live-build Config | Paketlisten, Hooks, Branding | ✅ |
| Auto-Login (tty1) | systemd getty override | ✅ |
| Chromium Kiosk | openbox + chromium --kiosk | ✅ |
| openPlank Service | systemd unit, auto-start | ✅ |
| First-Boot Wizard | Praxis-Name, Netzwerk, DB, Admin | ✅ |
| PostgreSQL Setup | Auto-init, User, DB | ✅ |
| Build Script | `build-iso.sh` | ✅ |
| Plymouth Splash | openPlank Boot-Logo | 🔴 |
| Wallpaper/Branding | Desktop-Hintergrund | 🔴 |
| ISO Test (QEMU) | Boot + Setup durchspielen | 🔴 |
| USB Test (Hardware) | Echtes System booten | 🔴 |
| Ollama Integration | Lokale KI vorinstalliert | 🟡 |

**Geschätzt:** 2-3 Tage

## Phase 2: Desktop Session

| Task | Beschreibung | Status |
|------|-------------|--------|
| Sway als Compositor | wlroots-basiert, IPC | 🔴 |
| Sway IPC Bridge | Scene Graph → Sway Befehle | 🔴 |
| Multi-Monitor | Wayland native | 🔴 |
| D-Bus Interface | org.openplank.KiDE | ✅ (Spec) |
| Notification Daemon | Desktop Notifications | 🔴 |
| Screen Lock | Bildschirmsperre | 🔴 |
| Power Management | Suspend, Shutdown Dialoge | 🔴 |

**Geschätzt:** 2-4 Wochen

## Phase 3: Native KI-DE

| Task | Beschreibung | Status |
|------|-------------|--------|
| Eigener Compositor | Rust + smithay oder C + wlroots | 🔴 |
| Native Widgets | GTK4 oder Qt6 statt WebView | 🔴 |
| Voice Engine | STT → Bridge → TTS Pipeline | 🔴 |
| Viewport Routing | Widget ↔ Screen Zuordnung | 🔴 |
| Drag & Drop | Zwischen Viewports | 🔴 |
| OTA Updates | A/B Partitionen, auto-update | 🔴 |
| Appliance Mode | Read-only root, recovery | 🔴 |
| AR/Smartglass | Viewport für Datenbrillen | 🔴 |

**Geschätzt:** 3-6 Monate

## Langfrist-Vision

- Eigenes Installationsprogramm (Calamares Fork)
- Eigener App Store (Flatpak-basiert)
- Plugin-Widgets von Drittanbietern
- Praxis-übergreifendes Multi-Standort
- Patienten-Terminal (Self-Checkin Kiosk)
- TI-Integration auf OS-Level
