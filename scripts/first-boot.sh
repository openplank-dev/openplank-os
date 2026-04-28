#!/bin/bash
# openPlank OS — First Boot Setup Wizard
# Runs on first boot to configure the system
# Called from: /etc/systemd/system/openplank-firstboot.service

set -e

SETUP_DONE="/opt/openplank/.setup-done"

if [ -f "$SETUP_DONE" ]; then
    exit 0
fi

clear
echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     Willkommen bei openPlank OS!      ║"
echo "  ║                                       ║"
echo "  ║  KI Desktop Environment für           ║"
echo "  ║        Arztpraxen                     ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# === Step 1: Praxis-Name ===
echo "📋 Schritt 1/4: Praxis-Einstellungen"
echo ""
read -p "  Praxis-Name: " PRAXIS_NAME
PRAXIS_NAME=${PRAXIS_NAME:-"Meine Praxis"}
read -p "  Praxis-Adresse: " PRAXIS_ADDR
read -p "  Telefon: " PRAXIS_PHONE
echo ""

# === Step 2: Netzwerk ===
echo "🌐 Schritt 2/4: Netzwerk"
echo ""
echo "  Verfügbare Verbindungen:"
nmcli device status 2>/dev/null || echo "  (NetworkManager nicht verfügbar)"
echo ""
read -p "  WiFi einrichten? (j/n): " WIFI_SETUP
if [ "$WIFI_SETUP" = "j" ]; then
    nmcli device wifi list 2>/dev/null
    read -p "  SSID: " WIFI_SSID
    read -sp "  Passwort: " WIFI_PASS
    echo ""
    nmcli device wifi connect "$WIFI_SSID" password "$WIFI_PASS" 2>/dev/null || echo "  ⚠️ WiFi-Verbindung fehlgeschlagen"
fi
echo ""

# === Step 3: Datenbank ===
echo "💾 Schritt 3/4: Datenbank"
echo ""
echo "  PostgreSQL wird konfiguriert..."
sudo -u postgres psql -c "ALTER USER openplank WITH PASSWORD 'openplank';" 2>/dev/null || true
echo "  ✅ Datenbank bereit"
echo ""

# === Step 4: Admin-Benutzer ===
echo "👤 Schritt 4/4: Admin-Benutzer"
echo ""
read -p "  Admin E-Mail: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@openplank.local"}
read -sp "  Admin Passwort: " ADMIN_PASS
ADMIN_PASS=${ADMIN_PASS:-"admin123"}
echo ""
echo ""

# === Write config ===
mkdir -p /opt/openplank/app/server
cat > /opt/openplank/app/server/.env << ENVFILE
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://openplank:openplank@localhost/openplank
PRAXIS_NAME=${PRAXIS_NAME}
PRAXIS_ADDRESS=${PRAXIS_ADDR}
PRAXIS_PHONE=${PRAXIS_PHONE}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASS}
ENVFILE

# === Run migrations ===
echo "🔧 Initialisiere Datenbank..."
cd /opt/openplank/app/server
node dist/scripts/first-setup.js 2>/dev/null || echo "  ⚠️ Migrations übersprungen (wird beim Server-Start nachgeholt)"

# === Mark setup done ===
touch "$SETUP_DONE"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║         ✅ Setup abgeschlossen!        ║"
echo "  ║                                       ║"
echo "  ║  openPlank startet in 3 Sekunden...   ║"
echo "  ╚═══════════════════════════════════════╝"
sleep 3

# Restart openplank service to pick up new config
systemctl restart openplank.service
