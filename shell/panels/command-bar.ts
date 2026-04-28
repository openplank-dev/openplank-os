/**
 * KI-DE Command Bar
 * 
 * Das zentrale Eingabefeld für KI-Befehle.
 * Wie Spotlight (macOS) oder Alfred, aber mit KI.
 * 
 * Aktivierung: Tastenkürzel (z.B. Super+Space) oder KI-Button in Taskbar
 * 
 * Features:
 * - Natürlichsprachliche Eingabe
 * - App-Launcher (tippe App-Name)
 * - Datei-Suche
 * - System-Befehle ("Lautstärke auf 50%", "WiFi aus")
 * - Schnelle Berechnungen ("42 * 17")
 * - KI-Chat (mehrzeilige Konversation)
 * 
 * Layout:
 * ┌──────────────────────────────────────────────┐
 * │  🤖  Was möchtest du tun?           [Enter]  │
 * ├──────────────────────────────────────────────┤
 * │  ▸ Firefox öffnen                   (App)    │
 * │  ▸ Terminal öffnen                  (App)    │
 * │  ▸ firefox.desktop              (Datei)     │
 * └──────────────────────────────────────────────┘
 */

export interface CommandBarConfig {
  shortcut: string;           // z.B. "Super+Space"
  width: number;              // px
  maxResults: number;
  showHints: boolean;
  kiEnabled: boolean;         // KI-Verarbeitung an/aus
  kiProvider: string;         // "ollama" | "openai" | "local"
  position: 'center' | 'top'; // Wo erscheint die Bar
}

export interface CommandBarResult {
  type: 'app' | 'file' | 'action' | 'ki' | 'calc';
  icon?: string;
  title: string;
  subtitle?: string;
  action: () => void;
  score: number;              // Relevanz (0-1)
}

export const DEFAULT_COMMAND_BAR_CONFIG: CommandBarConfig = {
  shortcut: 'Super+Space',
  width: 600,
  maxResults: 8,
  showHints: true,
  kiEnabled: true,
  kiProvider: 'ollama',
  position: 'center',
};
