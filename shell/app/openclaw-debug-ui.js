/**
 * KI-DE — OpenClaw Debug UI (Part 2)
 * Scene Graph Visualizer, Performance Charts, Console, Hooks
 */

// ============================================
// Debug Scene Graph Visualizer
// ============================================
function debugRefreshScene() {
    const tree = document.getElementById('debug-scene-tree');
    if (!tree) return;

    // Build tree from Desktop.windows
    const windows = [...Desktop.windows.values()];
    
    let html = `<div class="debug-tree-node debug-tree-root" onclick="debugSelectWidget('desktop')">
        <span class="debug-tree-icon">🖥️</span>
        <span class="debug-tree-label">Desktop</span>
        <span class="debug-tree-badge">${windows.length} Fenster</span>
    </div>`;

    windows.forEach(w => {
        const state = w.minimized ? '🔽' : w.maximized ? '🔼' : '📐';
        const focusBadge = Desktop.activeWindow === w.id ? ' <span class="debug-tree-focus">FOCUS</span>' : '';
        html += `
            <div class="debug-tree-node debug-tree-child" onclick="debugSelectWidget('${w.id}')">
                <span class="debug-tree-icon">${w.icon}</span>
                <span class="debug-tree-label">${escDebug(w.title)}</span>
                <span class="debug-tree-meta">${state} z:${w.element?.style.zIndex || '?'} [${Math.round(w.x)},${Math.round(w.y)} ${w.width}×${w.height}]</span>
                ${focusBadge}
            </div>
        `;
    });

    // Taskbar items
    html += `<div class="debug-tree-node debug-tree-root" style="margin-top:8px;">
        <span class="debug-tree-icon">📊</span>
        <span class="debug-tree-label">Taskbar</span>
    </div>`;
    document.querySelectorAll('.taskbar-item').forEach(item => {
        html += `<div class="debug-tree-node debug-tree-child">
            <span class="debug-tree-icon">◻️</span>
            <span class="debug-tree-label">${escDebug(item.textContent.trim())}</span>
        </div>`;
    });

    // Desktop theme
    html += `<div class="debug-tree-node debug-tree-root" style="margin-top:8px;">
        <span class="debug-tree-icon">🎨</span>
        <span class="debug-tree-label">Theme: ${Desktop.theme}</span>
    </div>`;

    tree.innerHTML = html;
}

function debugSelectWidget(id) {
    const detail = document.getElementById('debug-widget-detail');
    if (!detail) return;

    if (id === 'desktop') {
        detail.textContent = JSON.stringify({
            type: 'desktop',
            theme: Desktop.theme,
            windowCount: Desktop.windows.size,
            zIndex: Desktop.zIndex,
            apps: Object.keys(Desktop.apps),
            notifications: Desktop.notifications.length,
        }, null, 2);
        return;
    }

    const w = Desktop.windows.get(id);
    if (!w) {
        detail.textContent = `Widget "${id}" nicht gefunden`;
        return;
    }

    // Highlight the window
    document.querySelectorAll('.window').forEach(el => el.style.outline = '');
    if (w.element) {
        w.element.style.outline = '2px solid #5B9AA0';
        setTimeout(() => { if (w.element) w.element.style.outline = ''; }, 2000);
    }

    detail.textContent = JSON.stringify({
        id: w.id,
        appId: w.appId,
        title: w.title,
        position: { x: Math.round(w.x), y: Math.round(w.y) },
        size: { width: w.width, height: w.height },
        state: {
            minimized: w.minimized,
            maximized: w.maximized,
            focused: Desktop.activeWindow === w.id,
        },
        zIndex: parseInt(w.element?.style.zIndex || '0'),
        domId: w.element?.id,
    }, null, 2);
}


// ============================================
// Performance Charts (Canvas)
// ============================================
const perfData = {
    fps: [],
    mem: [],
    maxPoints: 120,
};

function debugUpdatePerf() {
    const snap = SystemMonitor.snapshot();

    // FPS
    perfData.fps.push(snap.fps);
    if (perfData.fps.length > perfData.maxPoints) perfData.fps.shift();

    // Memory
    const memMb = snap.heap.used ? Math.round(snap.heap.used / 1024 / 1024) : 0;
    perfData.mem.push(memMb);
    if (perfData.mem.length > perfData.maxPoints) perfData.mem.shift();

    // Draw FPS chart
    const fpsCanvas = document.getElementById('debug-fps-canvas');
    if (fpsCanvas && fpsCanvas.offsetParent) {
        drawChart(fpsCanvas, perfData.fps, { min: 0, max: 65, label: 'FPS', color: '#10B981', warn: 30 });
    }

    // Draw memory chart
    const memCanvas = document.getElementById('debug-mem-canvas');
    if (memCanvas && memCanvas.offsetParent) {
        drawChart(memCanvas, perfData.mem, { min: 0, max: Math.max(200, ...perfData.mem) + 20, label: 'MB', color: '#3B82F6', warn: 150 });
    }

    // Command history
    const cmdHistory = document.getElementById('debug-cmd-history');
    if (cmdHistory && cmdHistory.offsetParent) {
        const cmds = SystemMonitor.commandHistory.slice(-20).reverse();
        cmdHistory.innerHTML = cmds.map(c => {
            const icon = c.success ? '✅' : '❌';
            const time = c.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `<div class="debug-cmd-row">${icon} <span style="opacity:0.5">${time}</span> <code>${escDebug(c.cmd)}</code> <span style="opacity:0.5">${c.duration}ms</span></div>`;
        }).join('');
    }
}

function drawChart(canvas, data, opts) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const { min, max, label, color, warn } = opts;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Warning line
    if (warn) {
        const wy = h - ((warn - min) / (max - min)) * h;
        ctx.strokeStyle = 'rgba(239,68,68,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(w, wy); ctx.stroke();
        ctx.setLineDash([]);
    }

    // Data line
    if (data.length < 2) return;
    const step = w / (perfData.maxPoints - 1);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    data.forEach((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / (max - min)) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under line
    ctx.lineTo((data.length - 1) * step, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ',0.1)').replace('rgb', 'rgba');
    ctx.fill();

    // Current value label
    const current = data[data.length - 1];
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`${current} ${label}`, 8, 18);
}


// ============================================
// Debug Console (eval + KI-DE commands)
// ============================================
const debugConsoleHistory = [];
let debugConsoleHistoryIdx = -1;

function debugExecConsole() {
    const input = document.getElementById('debug-console-input');
    const output = document.getElementById('debug-console-output');
    if (!input || !output) return;

    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';

    debugConsoleHistory.push(cmd);
    debugConsoleHistoryIdx = debugConsoleHistory.length;

    // Show input
    output.innerHTML += `<div class="debug-console-line"><span class="debug-prompt">❯</span> <span class="debug-console-cmd">${escDebug(cmd)}</span></div>`;

    // KI-DE built-in commands
    if (cmd.startsWith('/')) {
        debugExecBuiltin(cmd, output);
    } else {
        // JavaScript eval
        try {
            const result = eval(cmd);
            const str = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            output.innerHTML += `<div class="debug-console-line debug-console-result">${escDebug(str)}</div>`;
        } catch (e) {
            output.innerHTML += `<div class="debug-console-line debug-console-error">${escDebug(e.message)}</div>`;
        }
    }

    output.scrollTop = output.scrollHeight;
    OpenClaw.addLog('console', cmd, 'info');
}

function debugExecBuiltin(cmd, output) {
    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
        case '/help':
            output.innerHTML += `<div class="debug-console-line debug-console-result">
Verfügbare Befehle:
  /help                 — Diese Hilfe
  /status               — System-Status
  /windows              — Alle Fenster auflisten
  /open &lt;app&gt;           — App öffnen (terminal, files, browser, settings, editor)
  /close &lt;id&gt;           — Fenster schließen
  /theme &lt;light|dark&gt;   — Theme wechseln
  /scene                — Scene Graph Snapshot
  /metrics              — Performance-Metriken
  /oc status            — OpenClaw Gateway Status
  /oc sessions          — OpenClaw Sessions
  /oc send &lt;key&gt; &lt;msg&gt;  — Nachricht an Session senden
  /oc config            — OpenClaw Config anzeigen
  /clear                — Konsole leeren
  
  Alles andere = JavaScript eval
</div>`;
            break;

        case '/status': {
            const snap = SystemMonitor.snapshot();
            output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(snap, null, 2)}</div>`;
            break;
        }

        case '/windows': {
            const wins = [...Desktop.windows.values()].map(w => ({
                id: w.id, app: w.appId, title: w.title,
                pos: `${Math.round(w.x)},${Math.round(w.y)}`, size: `${w.width}×${w.height}`,
                state: w.minimized ? 'minimized' : w.maximized ? 'maximized' : 'normal',
                focused: Desktop.activeWindow === w.id,
            }));
            output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(wins, null, 2)}</div>`;
            break;
        }

        case '/open':
            if (parts[1] && Desktop.apps[parts[1]]) {
                openApp(parts[1]);
                output.innerHTML += `<div class="debug-console-line debug-console-result">✅ ${parts[1]} geöffnet</div>`;
            } else {
                output.innerHTML += `<div class="debug-console-line debug-console-error">Unbekannte App: ${escDebug(parts[1] || '?')}. Verfügbar: ${Object.keys(Desktop.apps).join(', ')}</div>`;
            }
            break;

        case '/close': {
            const w = Desktop.windows.get(parts[1]);
            if (w) { w.close(); output.innerHTML += `<div class="debug-console-line debug-console-result">✅ Fenster geschlossen</div>`; }
            else output.innerHTML += `<div class="debug-console-line debug-console-error">Fenster nicht gefunden: ${escDebug(parts[1] || '?')}</div>`;
            break;
        }

        case '/theme':
            if (parts[1] === 'light' || parts[1] === 'dark') {
                if (Desktop.theme !== parts[1]) toggleTheme();
                output.innerHTML += `<div class="debug-console-line debug-console-result">✅ Theme: ${parts[1]}</div>`;
            } else {
                output.innerHTML += `<div class="debug-console-line debug-console-error">Nutze: /theme light oder /theme dark</div>`;
            }
            break;

        case '/scene':
            debugRefreshScene();
            output.innerHTML += `<div class="debug-console-line debug-console-result">✅ Scene Graph aktualisiert (${Desktop.windows.size} Fenster)</div>`;
            break;

        case '/metrics': {
            const snap = SystemMonitor.snapshot();
            output.innerHTML += `<div class="debug-console-line debug-console-result">
FPS:      ${snap.fps}
Heap:     ${snap.heap.used ? Math.round(snap.heap.used/1024/1024) + 'MB' : 'n/a'}
DOM:      ${snap.dom} nodes
Windows:  ${snap.windows}
Commands: ${snap.commands.executed} ok / ${snap.commands.failed} fail
Uptime:   ${snap.uptime}s
</div>`;
            break;
        }

        case '/oc':
            debugExecOC(parts.slice(1), output);
            break;

        case '/clear':
            output.innerHTML = '';
            break;

        default:
            output.innerHTML += `<div class="debug-console-line debug-console-error">Unbekannt: ${escDebug(command)}. Tippe /help</div>`;
    }
}

async function debugExecOC(args, output) {
    if (!OpenClaw.connected) {
        output.innerHTML += `<div class="debug-console-line debug-console-error">OpenClaw nicht verbunden. Verbinde zuerst im Übersicht-Tab.</div>`;
        return;
    }

    switch (args[0]) {
        case 'status':
            try {
                const health = await OpenClaw.api('/health');
                output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(health, null, 2)}</div>`;
            } catch (e) {
                output.innerHTML += `<div class="debug-console-line debug-console-error">${escDebug(e.message)}</div>`;
            }
            break;

        case 'sessions':
            try {
                const sessions = await OpenClaw.getSessions();
                output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(sessions, null, 2)}</div>`;
            } catch (e) {
                output.innerHTML += `<div class="debug-console-line debug-console-error">${escDebug(e.message)}</div>`;
            }
            break;

        case 'send':
            if (args.length < 3) {
                output.innerHTML += `<div class="debug-console-line debug-console-error">Nutze: /oc send &lt;sessionKey&gt; &lt;nachricht&gt;</div>`;
            } else {
                const key = args[1];
                const msg = args.slice(2).join(' ');
                try {
                    const result = await OpenClaw.sendToSession(key, msg);
                    output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(result, null, 2)}</div>`;
                } catch (e) {
                    output.innerHTML += `<div class="debug-console-line debug-console-error">${escDebug(e.message)}</div>`;
                }
            }
            break;

        case 'config':
            try {
                const cfg = await OpenClaw.getConfig();
                output.innerHTML += `<div class="debug-console-line debug-console-result">${JSON.stringify(cfg, null, 2)}</div>`;
            } catch (e) {
                output.innerHTML += `<div class="debug-console-line debug-console-error">${escDebug(e.message)}</div>`;
            }
            break;

        default:
            output.innerHTML += `<div class="debug-console-line debug-console-error">OpenClaw Befehle: status, sessions, send &lt;key&gt; &lt;msg&gt;, config</div>`;
    }
}

function debugClearConsole() {
    const output = document.getElementById('debug-console-output');
    if (output) output.innerHTML = '';
}


// ============================================
// Debug Config Viewer
// ============================================
async function debugLoadConfig() {
    const view = document.getElementById('debug-config-view');
    if (!view) return;

    if (!OpenClaw.connected) {
        view.textContent = 'OpenClaw nicht verbunden';
        return;
    }

    try {
        const cfg = await OpenClaw.getConfig();
        view.textContent = JSON.stringify(cfg, null, 2);
    } catch (e) {
        view.textContent = `Fehler: ${e.message}`;
    }
}


// ============================================
// Network Logging (Monkey-patch fetch)
// ============================================
const debugNetLog = [];
const _originalFetch = window.fetch;

window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const method = args[1]?.method || 'GET';
    const start = performance.now();

    try {
        const response = await _originalFetch.apply(this, args);
        const duration = Math.round(performance.now() - start);
        const entry = {
            time: new Date(),
            method,
            url,
            status: response.status,
            duration,
            ok: response.ok,
        };
        debugNetLog.push(entry);
        if (debugNetLog.length > 200) debugNetLog.shift();

        // Update network tab if visible
        debugUpdateNetLog();

        if (!response.ok) {
            OpenClaw.addLog('network', `${method} ${url} → ${response.status} (${duration}ms)`, 'warn');
        }

        return response;
    } catch (e) {
        const duration = Math.round(performance.now() - start);
        debugNetLog.push({
            time: new Date(), method, url, status: 'ERR', duration, ok: false, error: e.message,
        });
        OpenClaw.addLog('network', `${method} ${url} → FEHLER: ${e.message} (${duration}ms)`, 'error');
        throw e;
    }
};

function debugUpdateNetLog() {
    const container = document.getElementById('debug-net-log');
    if (!container || !container.offsetParent) return;

    const recent = debugNetLog.slice(-30).reverse();
    container.innerHTML = recent.map(e => {
        const time = e.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const statusColor = e.ok ? '#10B981' : '#EF4444';
        return `<div class="debug-log-row">
            <span class="debug-log-time">${time}</span>
            <span style="color:${statusColor}; font-weight:600;">${e.status}</span>
            <span style="opacity:0.5">${e.method}</span>
            <span>${escDebug(e.url?.substring(0, 60) || '?')}</span>
            <span style="opacity:0.5">${e.duration}ms</span>
        </div>`;
    }).join('');
}


// ============================================
// Console Interceptor — capture console.log/warn/error
// ============================================
const _origLog = console.log;
const _origWarn = console.warn;
const _origError = console.error;

console.log = function(...args) {
    _origLog.apply(console, args);
    OpenClaw.addLog('shell', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'info');
};

console.warn = function(...args) {
    _origWarn.apply(console, args);
    OpenClaw.addLog('shell', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn');
};

console.error = function(...args) {
    _origError.apply(console, args);
    OpenClaw.addLog('shell', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error');
};

// Global error handler
window.addEventListener('error', (event) => {
    OpenClaw.addLog('error', `${event.message} (${event.filename}:${event.lineno})`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    OpenClaw.addLog('error', `Unhandled Promise: ${event.reason}`, 'error');
});


// ============================================
// Utility
// ============================================
function escDebug(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
}


// ============================================
// Init — Hook into Desktop lifecycle
// ============================================
function initDebugSystem() {
    // Start system monitor
    SystemMonitor.init();

    // Register log renderer
    OpenClaw.on('log', debugRenderLog);

    // Register OpenClaw as an app in the Desktop
    Desktop.apps.debug = { name: 'System Debug', icon: '🔧', color: '#5B9AA0' };
    Desktop.commandSuggestions.push(
        { id: 'debug', title: 'System Debug', desc: 'OpenClaw Debug & Diagnose', icon: '🔧' }
    );

    // Update overview metrics periodically
    setInterval(() => {
        const snap = SystemMonitor.snapshot();
        const el = (id) => document.getElementById(id);
        if (el('dm-fps')) el('dm-fps').textContent = snap.fps;
        if (el('dm-windows')) el('dm-windows').textContent = snap.windows;
        if (el('dm-dom')) el('dm-dom').textContent = snap.dom;
        if (el('dm-heap')) el('dm-heap').textContent = snap.heap.used ? Math.round(snap.heap.used / 1024 / 1024) : '—';
        if (el('dm-cmds')) el('dm-cmds').textContent = snap.commands.executed;
        if (el('dm-uptime')) el('dm-uptime').textContent = formatUptime(snap.uptime);
        if (el('dm-sessions')) el('dm-sessions').textContent = OpenClaw.sessions.length || '—';
        if (el('dm-errors')) el('dm-errors').textContent = OpenClaw.metrics.errors.length;

        // Network tab
        const wsState = OpenClaw.ws?.readyState;
        if (el('dn-gw-status')) el('dn-gw-status').textContent = OpenClaw.connected ? '🟢 Verbunden' : '🔴 Getrennt';
        if (el('dn-gw-url')) el('dn-gw-url').textContent = OpenClaw.gateway?.url || '—';
        if (el('dn-ws-status')) el('dn-ws-status').textContent = wsState === 1 ? '🟢 Open' : wsState === 0 ? '🟡 Connecting' : '🔴 Closed';

        // Performance charts
        debugUpdatePerf();
    }, 1000);

    // Recent events
    OpenClaw.on('log', (entry) => {
        const events = document.getElementById('debug-events');
        if (!events) return;
        const time = entry.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const colors = { info: 'var(--debug-text-dim)', warn: '#F59E0B', error: '#EF4444', success: '#10B981' };
        events.innerHTML = `<div style="padding:4px 0; border-bottom:1px solid var(--debug-border); font-size:0.85rem;">
            <span style="opacity:0.5">${time}</span>
            <span style="color:${colors[entry.level] || colors.info}">[${entry.source}]</span>
            ${escDebug(entry.message?.substring(0, 100))}
        </div>` + events.innerHTML;
        // Limit
        while (events.children.length > 20) events.removeChild(events.lastChild);
    });

    // Log startup
    OpenClaw.addLog('system', 'KI-DE Debug System initialisiert', 'success');
    OpenClaw.addLog('system', `Desktop Theme: ${Desktop.theme}`, 'info');
    OpenClaw.addLog('system', `User Agent: ${navigator.userAgent.substring(0, 80)}`, 'info');
}

function formatUptime(seconds) {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
    return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDebugSystem, 100);
});
