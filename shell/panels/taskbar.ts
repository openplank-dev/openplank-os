/**
 * KI-DE Taskbar Panel
 * 
 * Die Taskleiste am unteren Rand des Desktops.
 * Zeigt laufende Apps, System-Tray, Uhr, und den KI-Button.
 * 
 * Layout:
 * ┌──────────────────────────────────────────────────┐
 * │ 🏠 │ 🦊 Firefox │ 📝 Editor │ ··· │ 🔊 🔋 📶 23:34 │ 🤖 │
 * └──────────────────────────────────────────────────┘
 *  Launcher  Running Apps              System Tray    KI
 */

export interface TaskbarConfig {
  position: 'bottom' | 'top';
  height: number;                    // px
  autoHide: boolean;
  showClock: boolean;
  showSystemTray: boolean;
  showKiButton: boolean;
  showLauncher: boolean;
  transparency: number;             // 0-1
}

export interface TaskbarItem {
  id: string;
  widgetId: string;                 // Referenz zum Widget im Scene Graph
  appId: string;
  title: string;
  icon?: string;
  active: boolean;                  // Hat Fokus
  minimized: boolean;
  attention: boolean;               // Blinkt / will Aufmerksamkeit
  pinned: boolean;                  // Dauerhaft in der Taskbar
}

export interface SystemTrayItem {
  id: string;
  name: string;
  icon: string;
  tooltip?: string;
  menu?: { label: string; action: string }[];
}

export const DEFAULT_TASKBAR_CONFIG: TaskbarConfig = {
  position: 'bottom',
  height: 48,
  autoHide: false,
  showClock: true,
  showSystemTray: true,
  showKiButton: true,
  showLauncher: true,
  transparency: 0.85,
};
