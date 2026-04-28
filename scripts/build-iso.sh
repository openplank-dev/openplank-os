#!/bin/bash
# openPlank OS — ISO Build Script
# Builds a bootable ISO from the live-build configuration
#
# Usage: sudo ./scripts/build-iso.sh
#
# Prerequisites:
#   sudo apt install live-build debootstrap

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ISO_DIR="$ROOT_DIR/iso"
BUILD_DIR="$ROOT_DIR/build"

echo "╔═══════════════════════════════════════╗"
echo "║      openPlank OS — ISO Builder       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Bitte als root ausführen: sudo $0"
    exit 1
fi

# Check dependencies
for cmd in lb debootstrap; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "❌ '$cmd' nicht gefunden. Installiere: sudo apt install live-build debootstrap"
        exit 1
    fi
done

# Setup build directory
echo "📁 Build-Verzeichnis: $BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Clean previous build
if [ -d "$BUILD_DIR/.build" ]; then
    echo "🧹 Räume vorherigen Build auf..."
    lb clean --purge
fi

# Configure
echo "⚙️  Konfiguriere live-build..."
bash "$ISO_DIR/config/lb_config.sh"

# Copy package lists
mkdir -p config/package-lists
cp "$ISO_DIR/config/package-lists/"*.list.chroot config/package-lists/

# Copy hooks
mkdir -p config/hooks/live
cp "$ISO_DIR/hooks/"*.hook.chroot config/hooks/live/
chmod +x config/hooks/live/*.hook.chroot

# Copy branding
if [ -d "$ISO_DIR/branding" ]; then
    mkdir -p config/includes.chroot/opt/openplank-os-branding
    cp -r "$ISO_DIR/branding/"* config/includes.chroot/opt/openplank-os-branding/
fi

# Copy Shell App
if [ -d "$ROOT_DIR/shell/app" ]; then
    echo "📦 Kopiere KI-DE Shell App..."
    mkdir -p config/includes.chroot/opt/kide
    cp -r "$ROOT_DIR/shell/app/"* config/includes.chroot/opt/kide/
    chmod -R 755 config/includes.chroot/opt/kide
fi

# Build
echo ""
echo "🔨 Baue ISO... (das dauert 15-30 Minuten)"
echo ""
lb build 2>&1 | tee "$BUILD_DIR/build.log"

# Result
ISO_FILE=$(ls "$BUILD_DIR/"*.iso 2>/dev/null | head -1)
if [ -n "$ISO_FILE" ]; then
    SIZE=$(du -h "$ISO_FILE" | cut -f1)
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║            ✅ ISO fertig!              ║"
    echo "╠═══════════════════════════════════════╣"
    echo "║  Datei: $(basename "$ISO_FILE")"
    echo "║  Größe: $SIZE"
    echo "║  Pfad:  $ISO_FILE"
    echo "╠═══════════════════════════════════════╣"
    echo "║  USB schreiben:                       ║"
    echo "║  sudo dd if=$ISO_FILE of=/dev/sdX bs=4M"
    echo "║                                       ║"
    echo "║  VM testen:                           ║"
    echo "║  qemu-system-x86_64 -m 4096 \\        ║"
    echo "║    -cdrom $ISO_FILE -enable-kvm"
    echo "╚═══════════════════════════════════════╝"
else
    echo "❌ Build fehlgeschlagen. Siehe: $BUILD_DIR/build.log"
    exit 1
fi
