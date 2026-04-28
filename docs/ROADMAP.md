# KI-DE — Roadmap

## Phase 1: Kiosk-Shell (MVP) 🎯

**Ziel:** Ein bootbares ISO mit KI-gesteuertem Desktop.

| Task | Status |
|------|--------|
| Debian live-build Config | ✅ |
| Auto-Login + Chromium Kiosk | ✅ |
| Scene Graph + Widget Types | ✅ |
| KI Command Bridge (DE + EN) | ✅ |
| Shared Context | ✅ |
| Theme Engine (Light + Dark) | ✅ |
| Taskbar Panel Spec | ✅ |
| Build Script | ✅ |
| Plymouth Splash | 🔴 |
| Wallpaper / Branding | 🔴 |
| ISO Test (QEMU) | 🔴 |
| KI-DE Web Shell (HTML/CSS/JS) | 🔴 |
| Ollama Integration | 🟡 |

**Geschätzt:** 1-2 Wochen

## Phase 2: Sway Integration

| Task | Status |
|------|--------|
| Sway als Compositor | 🔴 |
| Sway IPC ↔ Scene Graph | 🔴 |
| D-Bus Bridge | 🔴 |
| Multi-Monitor | 🔴 |
| App Launcher | 🔴 |
| Notification Daemon | 🔴 |
| Screen Lock | 🔴 |
| Power Management | 🔴 |

**Geschätzt:** 4-6 Wochen

## Phase 3: planktop (Eigener Compositor)

| Task | Status |
|------|--------|
| Rust + smithay Compositor | 🔴 |
| Widget ↔ Wayland Surface | 🔴 |
| Voice Engine (STT → Bridge → TTS) | 🔴 |
| Viewport Routing (Screen-zu-Screen) | 🔴 |
| Drag & Drop zwischen Viewports | 🔴 |
| OTA Updates (A/B Partitionen) | 🔴 |
| Plugin-System für Widgets | 🔴 |

**Geschätzt:** 3-6 Monate

## Langfrist-Vision

- Eigenes Installationsprogramm
- App Store (Flatpak-basiert)
- Remote Desktop (KI-DE in der Cloud)
- Mobile Companion (Tablet als Viewport)
- AR-Viewport (Datenbrillen)
