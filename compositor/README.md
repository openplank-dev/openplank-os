# planktop — KI-DE Wayland Compositor

> Phase 2 — Eigener Wayland Compositor für das KI Desktop Environment

## Konzept

`planktop` ist ein minimaler Wayland-Compositor auf `wlroots`-Basis, der:

- Vom Scene Graph der KI-DE Shell gesteuert wird
- KI-Commands über D-Bus empfängt
- Apps als Wayland Surfaces rendert
- Multi-Monitor nativ unterstützt
- Tiling und Floating Layouts mischt (KI entscheidet)

## Architektur

```
┌─────────────────────────┐
│    KI-DE Shell          │
│  (Scene Graph + Bridge) │
├────────────┬────────────┤
│   D-Bus    │  WebSocket │
├────────────┴────────────┤
│       planktop          │
│   (Wayland Compositor)  │
├─────────────────────────┤
│       wlroots           │
├─────────────────────────┤
│   DRM/KMS │ libinput    │
└─────────────────────────┘
```

## Technologie-Optionen

### Option A: Sway + IPC (Quick Win für Phase 2)
- Pro: Sway existiert, hat IPC, wir steuern es remote
- Con: Nicht unser Compositor, limitierte Kontrolle
- **Empfohlen für Phase 2**

### Option B: Rust + smithay (Phase 3)
- Pro: Memory Safety, volle Kontrolle
- Con: Mehr Aufwand
- **Empfohlen für Phase 3**

### Option C: C + wlroots (wie Sway)
- Pro: Maximum Performance
- Con: C ist fehleranfällig

### Option D: Cage-Fork (Kiosk-only)
- Pro: Minimal (~1500 Zeilen)
- Con: Single-Window, kein Multi-App

## D-Bus Interface

```xml
<!-- org.openplank.Compositor -->
<interface name="org.openplank.Compositor">
    <!-- Window Management -->
    <method name="CreateSurface">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="(iiii)" name="geometry" direction="in"/>
        <arg type="s" name="viewport" direction="in"/>
    </method>
    <method name="MoveSurface">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="(ii)" name="position" direction="in"/>
    </method>
    <method name="ResizeSurface">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="(ii)" name="size" direction="in"/>
    </method>
    <method name="FocusSurface">
        <arg type="s" name="widgetId" direction="in"/>
    </method>
    <method name="CloseSurface">
        <arg type="s" name="widgetId" direction="in"/>
    </method>
    
    <!-- Layout -->
    <method name="SetLayout">
        <arg type="s" name="layoutJson" direction="in"/>
    </method>
    <method name="SplitView">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="s" name="direction" direction="in"/>
    </method>
    
    <!-- Viewport -->
    <method name="MoveToViewport">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="s" name="viewport" direction="in"/>
    </method>
    <method name="ListViewports">
        <arg type="s" name="viewportsJson" direction="out"/>
    </method>

    <!-- Signals -->
    <signal name="SurfaceCreated">
        <arg type="s" name="widgetId"/>
    </signal>
    <signal name="SurfaceClosed">
        <arg type="s" name="widgetId"/>
    </signal>
    <signal name="ViewportConnected">
        <arg type="s" name="viewportId"/>
    </signal>
</interface>
```

## Status

🔴 **Nicht implementiert** — Phase 1 nutzt Chromium Kiosk als Zwischenlösung.
