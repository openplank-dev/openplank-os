# openPlank OS — Architektur

## Überblick

```
┌──────────────────────────────────────────────────────────────┐
│                       Benutzer                               │
│            🎤 Sprache   👆 Touch   ⌨️ Tastatur               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │   Viewport   │  │   Viewport   │  │   Viewport   │     │
│   │   (Monitor)  │  │   (Tablet)   │  │   (Wand)     │     │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│          │                 │                  │              │
│   ┌──────┴─────────────────┴──────────────────┴───────┐     │
│   │              Viewport Manager                      │     │
│   │     (Welcher Screen zeigt welche Widgets?)         │     │
│   └────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│   ┌────────────────────────┴──────────────────────────┐     │
│   │              Scene Graph + Widget Registry          │     │
│   │     (Alle UI-Elemente als addressierbare Widgets)  │     │
│   └────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│   ┌──────────┐  ┌─────────┴────────┐  ┌──────────────┐     │
│   │  Theme   │  │   KI Command     │  │   Voice      │     │
│   │  Engine  │  │   Bridge         │  │   Engine     │     │
│   └──────────┘  └─────────┬────────┘  └──────────────┘     │
│                           │                                  │
│   ┌───────────────────────┴───────────────────────────┐     │
│   │              openPlank Server (Node.js)            │     │
│   │     API │ Auth │ Patients │ Appointments │ KI      │     │
│   └────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│   ┌──────────┐  ┌─────────┴──────┐  ┌────────────────┐     │
│   │PostgreSQL│  │    Ollama      │  │   Hardware     │     │
│   │  (Daten) │  │  (Lokale KI)   │  │ (Drucker etc)  │     │
│   └──────────┘  └────────────────┘  └────────────────┘     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   Compositor: Chromium Kiosk (Phase 1) → planktop (Phase 3) │
├──────────────────────────────────────────────────────────────┤
│   Wayland / X11                                              │
├──────────────────────────────────────────────────────────────┤
│   Linux Kernel (Debian 12)                                   │
├──────────────────────────────────────────────────────────────┤
│   Hardware (Mini-PC / Thin Client / Dental-Station)          │
└──────────────────────────────────────────────────────────────┘
```

## Boot-Sequenz

```
1. BIOS/UEFI
   ↓
2. GRUB → Linux Kernel
   ↓
3. systemd
   ├── postgresql.service          (Datenbank starten)
   ├── NetworkManager.service      (Netzwerk)
   ├── openplank-firstboot.service (Nur beim allerersten Boot)
   ├── openplank.service           (Server auf :3001)
   └── getty@tty1 (autologin)
       ↓
4. .bash_profile → startx
   ↓
5. openbox → chromium --kiosk → localhost:3001
   ↓
6. openPlank UI (Duality / Admin)
```

## Kommunikation

### Phase 1 (Kiosk)
```
Browser ←→ HTTP/WebSocket ←→ openPlank Server ←→ PostgreSQL
                                    ↕
                                  Ollama
```

### Phase 2+ (Native Compositor)
```
KI-DE ←→ D-Bus ←→ planktop (Compositor)
  ↕                    ↕
openPlank Server    Wayland Protocol
  ↕                    ↕
PostgreSQL         GPU/DRM/KMS
```

## Hardware-Anforderungen

### Minimum (Phase 1 Kiosk)
- CPU: x86_64, 2 Kerne
- RAM: 2 GB (4 GB empfohlen)
- Disk: 16 GB
- Netzwerk: Ethernet oder WiFi

### Empfohlen (mit lokaler KI)
- CPU: x86_64, 4+ Kerne
- RAM: 16 GB (für Ollama)
- GPU: Optional (für schnellere KI-Inferenz)
- Disk: 64 GB SSD
- Netzwerk: Gigabit Ethernet

### Empfohlene Hardware
- Intel NUC / Beelink Mini-PC (ab 200€)
- Lenovo ThinkCentre Tiny (ab 250€)
- HP ProDesk Mini (ab 300€)
- Raspberry Pi 5 (experimentell, ohne Ollama)
