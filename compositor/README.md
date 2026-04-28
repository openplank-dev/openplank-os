# planktop — openPlank Wayland Compositor

> Phase 2 — Eigener Wayland Compositor für das KI Desktop Environment

## Konzept

`planktop` ist ein minimaler Wayland-Compositor auf `wlroots`-Basis, der:

- Vom openPlank Scene Graph gesteuert wird
- KI-Commands über D-Bus empfängt
- Widgets als Wayland-Surfaces oder WebViews rendert
- Multi-Monitor nativ unterstützt

## Architektur

```
┌─────────────────────────┐
│     openPlank Server    │
│   (Scene Graph + KI)    │
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

### Option A: C + wlroots (wie Sway)
- Pro: Maximum Performance, direkte wlroots API
- Con: C ist fehleranfällig, langsame Entwicklung
- Referenz: [tinywl](https://gitlab.freedesktop.org/wlroots/wlroots/-/tree/master/tinywl)

### Option B: Rust + smithay
- Pro: Memory Safety, moderne Sprache
- Con: Smithay weniger ausgereift als wlroots
- Referenz: [smithay](https://github.com/Smithay/smithay)

### Option C: Cage-Fork (Kiosk-Compositor)
- Pro: Minimaler Aufwand, Cage ist ~1500 Zeilen C
- Con: Limitiert auf Single-Window Kiosk
- Referenz: [cage](https://github.com/cage-kiosk/cage)

### Option D: wlr-randr + Sway + IPC (Quick Win)
- Pro: Sway existiert, hat IPC, wir steuern es remote
- Con: Nicht unser Compositor, limitierte Kontrolle
- Referenz: [sway IPC](https://github.com/swaywm/sway/wiki/IPC-protocol)

**Empfehlung Phase 2:** Option D (Sway + IPC) als Quick Win, dann Option B (Rust + smithay) für Phase 3.

## D-Bus Interface

```xml
<!-- org.openplank.Compositor -->
<interface name="org.openplank.Compositor">
    <method name="CreateWidget">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="s" name="widgetType" direction="in"/>
        <arg type="(iiii)" name="geometry" direction="in"/> <!-- x, y, w, h -->
        <arg type="s" name="renderTarget" direction="in"/>
    </method>
    <method name="MoveWidget">
        <arg type="s" name="widgetId" direction="in"/>
        <arg type="(ii)" name="position" direction="in"/>
    </method>
    <method name="FocusWidget">
        <arg type="s" name="widgetId" direction="in"/>
    </method>
    <method name="SetLayout">
        <arg type="s" name="layoutJson" direction="in"/>
    </method>
    <signal name="WidgetClosed">
        <arg type="s" name="widgetId"/>
    </signal>
</interface>
```

## Status

🔴 **Nicht implementiert** — Phase 1 nutzt Chromium Kiosk als Zwischenlösung.
