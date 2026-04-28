/**
 * KI-DE Command Bridge
 * 
 * Übersetzt natürliche Sprache in Desktop-Aktionen.
 * Sprachunabhängig designed — Patterns für DE und EN.
 * 
 * Beispiele:
 *   "Öffne Firefox"                → launch:firefox
 *   "Open the terminal"            → launch:terminal
 *   "Leg das neben den Editor"     → split:right + target:editor
 *   "Put that on the projector"    → move-to-viewport:projector
 *   "Dunkles Theme"                → theme:dark
 *   "Dark mode"                    → theme:dark
 *   "Zeig alle Fenster"            → overview:show
 *   "Show all windows"             → overview:show
 */

import { WidgetAction } from '../scene-graph/widget';

interface CommandPattern {
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, input: string) => WidgetAction | null;
}

const COMMANDS: CommandPattern[] = [
  // ============================================
  // Launch / Öffne
  // ============================================
  {
    patterns: [
      /(?:öffne|starte?|launch|open|run)\s+(.+)/i,
    ],
    extract: (match) => ({
      type: 'launch',
      app: match[1].trim().toLowerCase(),
    }),
  },

  // ============================================
  // Close / Schließe
  // ============================================
  {
    patterns: [
      /(?:schließe?|beende|close|quit|exit)\s+(.+)/i,
      /(?:mach|make)\s+(.+)\s+(?:zu|closed)/i,
    ],
    extract: (match) => ({
      type: 'close',
      widgetId: resolveWidgetRef(match[1]),
    }),
  },

  // ============================================
  // Maximize / Minimieren / Vollbild
  // ============================================
  {
    patterns: [
      /(?:maximier|maximize|vollbild|fullscreen)\s*(?:das|the|dieses|this)?/i,
    ],
    extract: () => ({
      type: 'maximize',
      widgetId: '__focused__',
    }),
  },
  {
    patterns: [
      /(?:minimier|minimize|versteck|hide)\s*(?:das|the|dieses|this)?/i,
    ],
    extract: () => ({
      type: 'minimize',
      widgetId: '__focused__',
    }),
  },

  // ============================================
  // Split / Nebeneinander
  // ============================================
  {
    patterns: [
      /(?:leg|pack|put|move|schieb)\s+(?:das|es|it|this)?\s*(?:neben|next\s+to|beside)\s+(?:den|die|das|the)?\s*(.+)/i,
      /(?:split|teile?)\s+(?:nach\s+)?(links|rechts|oben|unten|left|right|top|bottom)/i,
    ],
    extract: (match) => {
      const dirMap: Record<string, 'left' | 'right' | 'top' | 'bottom'> = {
        links: 'left', left: 'left', rechts: 'right', right: 'right',
        oben: 'top', top: 'top', unten: 'bottom', bottom: 'bottom',
      };
      const dir = dirMap[match[1]?.toLowerCase()] || 'right';
      return {
        type: 'split',
        widgetId: '__focused__',
        direction: dir,
      };
    },
  },

  // ============================================
  // Move to Viewport / Monitor
  // ============================================
  {
    patterns: [
      /(?:auf|on|to)\s+(?:den|dem|the)?\s*(?:zweiten|anderen|second|other|externen|external)\s*(?:monitor|screen|bildschirm|display)/i,
      /(?:zeig|show|verschieb|move)\s+(?:das|es|it|this)?\s*(?:auf|on|to)\s+(?:den|dem|the)?\s*(.+?)(?:\s+monitor|\s+screen|\s+display)?$/i,
    ],
    extract: (match) => ({
      type: 'move-to-viewport',
      widgetId: '__focused__',
      viewport: match[1]?.trim() || 'external',
    }),
  },

  // ============================================
  // Theme
  // ============================================
  {
    patterns: [
      /(?:dunkle?s?|dark)\s*(?:theme|modus|mode)/i,
      /(?:theme|modus|mode)\s*(?:auf|to|:)?\s*(dark|dunkel)/i,
    ],
    extract: () => ({ type: 'theme', themeId: 'dark' }),
  },
  {
    patterns: [
      /(?:helle?s?|light|bright)\s*(?:theme|modus|mode)/i,
      /(?:theme|modus|mode)\s*(?:auf|to|:)?\s*(light|hell)/i,
    ],
    extract: () => ({ type: 'theme', themeId: 'light' }),
  },

  // ============================================
  // Overview / Alle Fenster
  // ============================================
  {
    patterns: [
      /(?:zeig|show)\s+(?:mir\s+)?(?:alle|all)\s+(?:fenster|windows)/i,
      /(?:overview|übersicht)/i,
    ],
    extract: () => ({ type: 'overview', show: true }),
  },

  // ============================================
  // Command Bar
  // ============================================
  {
    patterns: [
      /(?:command\s*bar|befehl|kommando)/i,
    ],
    extract: () => ({ type: 'command-bar', show: true }),
  },

  // ============================================
  // AR / Brille / Glasses
  // ============================================
  {
    patterns: [
      /(?:zeig|show)\s+(?:das|es|it|this)?\s*(?:auf|on)\s+(?:der|the)?\s*(?:brille|glasses|ar|headset)/i,
      /(?:auf|on)\s+(?:die|the)?\s*brille(?:\s+damit)?/i,
      /(?:project|projizier)\s+(?:das|es|it|this)?\s*(?:in\s+ar|auf\s+(?:die\s+)?brille)/i,
    ],
    extract: () => ({
      type: 'move-to-viewport',
      widgetId: '__focused__',
      viewport: 'ar',
    }),
  },
  {
    patterns: [
      /(?:nimm|take|entfern)\s+(?:das|es|it|this)?\s*(?:von|from)\s+(?:der|the)?\s*(?:brille|glasses|ar)/i,
      /(?:weg|off)\s+(?:von\s+)?(?:der\s+)?(?:brille|glasses)/i,
    ],
    extract: () => ({
      type: 'move-to-viewport',
      widgetId: '__focused__',
      viewport: 'desktop',
    }),
  },
  {
    patterns: [
      /(?:timer|stoppuhr)\s+(\d+)\s*(?:min(?:uten)?|sek(?:unden)?|s|m)?/i,
    ],
    extract: (match) => ({
      type: 'ar-hud',
      element: 'timer',
      data: { duration: parseInt(match[1]), unit: match[2] || 'min' },
    }),
  },
  {
    patterns: [
      /(?:notiz|note|merke?)\s*:?\s+(.+)/i,
    ],
    extract: (match) => ({
      type: 'ar-hud',
      element: 'notification',
      data: { title: 'Notiz', text: match[1] },
    }),
  },
  {
    patterns: [
      /(?:screenshot|foto|capture|aufnahme)/i,
    ],
    extract: () => ({
      type: 'screenshot',
      viewport: 'current',
    }),
  },

  // ============================================
  // Resize / Größe
  // ============================================
  {
    patterns: [
      /(?:mach|make)\s+(?:das|es|it|this)?\s*(?:größer|bigger|larger)/i,
    ],
    extract: () => ({
      type: 'resize',
      widgetId: '__focused__',
      size: { width: 200, height: 150 },  // Delta, wird relativ angewendet
    }),
  },
  {
    patterns: [
      /(?:mach|make)\s+(?:das|es|it|this)?\s*(?:kleiner|smaller)/i,
    ],
    extract: () => ({
      type: 'resize',
      widgetId: '__focused__',
      size: { width: -200, height: -150 },
    }),
  },
];

// ============================================
// Parser
// ============================================

export function parseCommand(input: string): WidgetAction | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const action = cmd.extract(match, trimmed);
        if (action) return action;
      }
    }
  }

  return null;
}

/**
 * Resolve a fuzzy widget reference to a widget ID.
 * "den Editor" → sucht nach Widget mit title containing "Editor"
 * "__focused__" = aktuell fokussiertes Widget
 */
function resolveWidgetRef(ref: string): string {
  // In Phase 1: einfach den String zurückgeben
  // Phase 2: Scene Graph durchsuchen
  return ref.trim().toLowerCase();
}

/**
 * Parse multiple commands from one input (z.B. "Öffne Firefox und leg es neben den Editor")
 */
export function parseCommands(input: string): WidgetAction[] {
  const parts = input.split(/\s+und\s+|\s+and\s+|\s*,\s*/i);
  const actions: WidgetAction[] = [];
  for (const part of parts) {
    const action = parseCommand(part);
    if (action) actions.push(action);
  }
  return actions;
}
