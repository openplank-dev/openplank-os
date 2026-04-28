/**
 * KI-DE — OpenClaw Debug System
 * 
 * Tief verankertes Debugging für das gesamte KI Desktop Environment.
 * OpenClaw ist das Gehirn von KI-DE — dieses Modul macht seine
 * Gedanken, Entscheidungen und Fehler sichtbar.
 * 
 * Architektur:
 *   KI-DE Shell ←→ OpenClaw Debug Bridge ←→ OpenClaw Gateway
 *       ↕                   ↕                     ↕
 *   Scene Graph       WebSocket/REST          Sessions
 *   Widget State      Agent Logs              Tool Calls
 *   D-Bus Events      Reasoning               Memory
 *   System Metrics    Config                   Models
 */

// ============================================
// OpenClaw Connection Manager
// ============================================
const OpenClaw = {
    // Connection state
    connected: false,
    gateway: null,          // { url, token }
    ws: null,               // WebSocket to gateway
    reconnectTimer: null,
    reconnectDelay: 3000,

    // Cached state
    sessions: [],
    activeSession: null,
    agents: [],
    config: {},
    models: [],
    logs: [],               // Ring buffer
    maxLogs: 2000,
    metrics: {
        uptime: 0,
        totalRequests: 0,
        totalTokens: 0,
        activeModels: [],
        memory: {},
        errors: [],
    },

    // Event bus
    listeners: new Map(),

    on(event, fn) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(fn);
        return () => this.listeners.get(event)?.delete(fn);
    },

    emit(event, data) {
        this.listeners.get(event)?.forEach(fn => {
            try { fn(data); } catch (e) { console.error(`[OpenClaw] Event handler error:`, e); }
        });
    },

    // ============================================
    // Connection
    // ============================================
    async connect(url, token) {
        this.gateway = { url: url.replace(/\/$/, ''), token };
        try {
            const health = await this.api('/health');
            if (health) {
                this.connected = true;
                this.emit('connected', { url, health });
                this.startWebSocket();
                this.startPolling();
                this.addLog('system', `Verbunden mit Gateway: ${url}`, 'success');
                return true;
            }
        } catch (e) {
            this.addLog('system', `Verbindungsfehler: ${e.message}`, 'error');
            this.connected = false;
            this.emit('disconnected', { error: e.message });
        }
        return false;
    },

    disconnect() {
        if (this.ws) { this.ws.close(); this.ws = null; }
        clearInterval(this.pollTimer);
        clearTimeout(this.reconnectTimer);
        this.connected = false;
        this.emit('disconnected', {});
    },

    // ============================================
    // REST API
    // ============================================
    async api(path, opts = {}) {
        if (!this.gateway) throw new Error('Nicht verbunden');
        const url = `${this.gateway.url}${path}`;
        const headers = { 'Content-Type': 'application/json' };
        if (this.gateway.token) headers['Authorization'] = `Bearer ${this.gateway.token}`;
        
        const res = await fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
        
        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            throw new Error(`${res.status}: ${errText}`);
        }
        return res.json();
    },

    // ============================================
    // WebSocket (Live Stream)
    // ============================================
    startWebSocket() {
        if (!this.gateway) return;
        const wsUrl = this.gateway.url.replace(/^http/, 'ws') + '/ws';
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.addLog('websocket', 'WebSocket verbunden', 'success');
                // Subscribe to events
                this.wsSend({ type: 'subscribe', channels: ['logs', 'sessions', 'tools', 'errors'] });
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleWsMessage(msg);
                } catch (e) {
                    this.addLog('websocket', `Parse-Fehler: ${event.data.substring(0, 100)}`, 'warn');
                }
            };

            this.ws.onerror = (e) => {
                this.addLog('websocket', 'WebSocket Fehler', 'error');
            };

            this.ws.onclose = () => {
                this.addLog('websocket', 'WebSocket getrennt — Reconnect...', 'warn');
                this.reconnectTimer = setTimeout(() => this.startWebSocket(), this.reconnectDelay);
            };
        } catch (e) {
            this.addLog('websocket', `WebSocket Fehler: ${e.message}`, 'error');
        }
    },

    wsSend(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    },

    handleWsMessage(msg) {
        switch (msg.type) {
            case 'log':
                this.addLog(msg.source || 'gateway', msg.message, msg.level || 'info');
                break;
            case 'session_update':
                this.emit('session_update', msg.data);
                break;
            case 'tool_call':
                this.addLog('tool', `${msg.data?.tool}: ${JSON.stringify(msg.data?.params).substring(0, 120)}`, 'info');
                this.emit('tool_call', msg.data);
                break;
            case 'error':
                this.addLog('error', msg.message, 'error');
                this.metrics.errors.push({ time: Date.now(), message: msg.message });
                if (this.metrics.errors.length > 100) this.metrics.errors.shift();
                this.emit('error', msg);
                break;
            case 'metrics':
                Object.assign(this.metrics, msg.data);
                this.emit('metrics', this.metrics);
                break;
        }
    },

    // ============================================
    // Polling Fallback (wenn kein WS)
    // ============================================
    startPolling() {
        this.pollTimer = setInterval(async () => {
            if (!this.connected) return;
            try {
                // Session list
                try {
                    const sessions = await this.api('/api/sessions');
                    this.sessions = sessions?.sessions || sessions || [];
                    this.emit('sessions', this.sessions);
                } catch {}

                // Status / Health
                try {
                    const status = await this.api('/health');
                    if (status) {
                        this.metrics.uptime = status.uptime;
                        this.metrics.memory = status.memory;
                        this.emit('metrics', this.metrics);
                    }
                } catch {}
            } catch (e) {
                // silent
            }
        }, 10000);
    },

    // ============================================
    // Log System (Ring Buffer)
    // ============================================
    addLog(source, message, level = 'info') {
        const entry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            time: new Date(),
            source,
            message,
            level,
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) this.logs.shift();
        this.emit('log', entry);
    },

    // ============================================
    // Session Management
    // ============================================
    async getSessions() {
        try {
            const data = await this.api('/api/sessions');
            this.sessions = data?.sessions || data || [];
            return this.sessions;
        } catch (e) {
            this.addLog('sessions', `Fehler: ${e.message}`, 'error');
            return [];
        }
    },

    async getSessionHistory(sessionKey, limit = 50) {
        try {
            return await this.api(`/api/sessions/${encodeURIComponent(sessionKey)}/history?limit=${limit}`);
        } catch (e) {
            this.addLog('sessions', `History-Fehler: ${e.message}`, 'error');
            return null;
        }
    },

    async sendToSession(sessionKey, message) {
        try {
            return await this.api(`/api/sessions/${encodeURIComponent(sessionKey)}/send`, {
                method: 'POST',
                body: JSON.stringify({ message }),
            });
        } catch (e) {
            this.addLog('sessions', `Send-Fehler: ${e.message}`, 'error');
            return null;
        }
    },

    // ============================================
    // Config
    // ============================================
    async getConfig(path) {
        try {
            return await this.api(`/api/config${path ? '/' + path : ''}`);
        } catch (e) {
            this.addLog('config', `Config-Fehler: ${e.message}`, 'error');
            return null;
        }
    },

    // ============================================
    // Models
    // ============================================
    async getModels() {
        try {
            const data = await this.api('/api/models');
            this.models = data?.models || data || [];
            return this.models;
        } catch (e) {
            this.addLog('models', `Fehler: ${e.message}`, 'error');
            return [];
        }
    },
};


// ============================================
// KI-DE System Monitor — Internal Metrics
// ============================================
const SystemMonitor = {
    // Widget lifecycle tracking
    widgetCreated: 0,
    widgetDestroyed: 0,
    widgetErrors: [],

    // Render performance
    frameTimestamps: [],
    fps: 0,

    // Command Bridge stats
    commandsExecuted: 0,
    commandsFailed: 0,
    commandHistory: [],       // last 100 commands

    // Memory tracking
    jsHeapUsed: 0,
    jsHeapTotal: 0,

    // DOM stats
    domNodes: 0,
    windowCount: 0,

    // Track FPS
    trackFps() {
        const now = performance.now();
        this.frameTimestamps.push(now);
        // Keep last 60 frames
        while (this.frameTimestamps.length > 60 && now - this.frameTimestamps[0] > 1000) {
            this.frameTimestamps.shift();
        }
        if (this.frameTimestamps.length > 1) {
            const elapsed = (this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0]) / 1000;
            this.fps = Math.round((this.frameTimestamps.length - 1) / elapsed);
        }
        requestAnimationFrame(() => this.trackFps());
    },

    // Collect system snapshot
    snapshot() {
        if (performance.memory) {
            this.jsHeapUsed = performance.memory.usedJSHeapSize;
            this.jsHeapTotal = performance.memory.totalJSHeapSize;
        }
        this.domNodes = document.querySelectorAll('*').length;
        this.windowCount = Desktop.windows.size;

        return {
            fps: this.fps,
            heap: { used: this.jsHeapUsed, total: this.jsHeapTotal },
            dom: this.domNodes,
            windows: this.windowCount,
            widgets: { created: this.widgetCreated, destroyed: this.widgetDestroyed, errors: this.widgetErrors.length },
            commands: { executed: this.commandsExecuted, failed: this.commandsFailed },
            uptime: Math.floor(performance.now() / 1000),
        };
    },

    // Track a command
    trackCommand(cmd, success, duration) {
        if (success) this.commandsExecuted++; else this.commandsFailed++;
        this.commandHistory.push({
            cmd, success, duration, time: new Date(),
        });
        if (this.commandHistory.length > 100) this.commandHistory.shift();
    },

    init() {
        this.trackFps();
        // Periodic snapshot
        setInterval(() => {
            const snap = this.snapshot();
            OpenClaw.emit('system_metrics', snap);
        }, 2000);
    },
};


// ============================================
// Debug Panel UI Builder
// ============================================
function buildDebugApp() {
    return `
        <div class="debug-app">
            <div class="debug-sidebar">
                <div class="debug-nav-item active" data-tab="overview" onclick="debugTab('overview')">
                    <span class="debug-nav-icon">📊</span> Übersicht
                </div>
                <div class="debug-nav-item" data-tab="logs" onclick="debugTab('logs')">
                    <span class="debug-nav-icon">📜</span> Logs
                </div>
                <div class="debug-nav-item" data-tab="sessions" onclick="debugTab('sessions')">
                    <span class="debug-nav-icon">💬</span> Sessions
                </div>
                <div class="debug-nav-item" data-tab="scene" onclick="debugTab('scene')">
                    <span class="debug-nav-icon">🧩</span> Scene Graph
                </div>
                <div class="debug-nav-item" data-tab="performance" onclick="debugTab('performance')">
                    <span class="debug-nav-icon">⚡</span> Performance
                </div>
                <div class="debug-nav-item" data-tab="network" onclick="debugTab('network')">
                    <span class="debug-nav-icon">🌐</span> Netzwerk
                </div>
                <div class="debug-nav-item" data-tab="config" onclick="debugTab('config')">
                    <span class="debug-nav-icon">⚙️</span> Config
                </div>
                <div class="debug-nav-item" data-tab="console" onclick="debugTab('console')">
                    <span class="debug-nav-icon">🖥️</span> Konsole
                </div>
            </div>
            <div class="debug-content">
                <!-- Overview Tab -->
                <div class="debug-tab active" id="debug-tab-overview">
                    <div class="debug-header">
                        <h3>KI-DE System — Übersicht</h3>
                        <div class="debug-connection" id="debug-conn-status">
                            <span class="debug-dot disconnected"></span> Nicht verbunden
                        </div>
                    </div>
                    <div class="debug-connect-form" id="debug-connect-form">
                        <input type="text" id="debug-gw-url" placeholder="Gateway URL (z.B. http://localhost:3000)" 
                               value="http://localhost:3000" class="debug-input">
                        <input type="text" id="debug-gw-token" placeholder="API Token (optional)" class="debug-input">
                        <button onclick="debugConnect()" class="debug-btn-primary">Verbinden</button>
                    </div>
                    <div class="debug-grid" id="debug-overview-grid">
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">FPS</div>
                            <div class="debug-metric-value" id="dm-fps">—</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">Fenster</div>
                            <div class="debug-metric-value" id="dm-windows">0</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">DOM Nodes</div>
                            <div class="debug-metric-value" id="dm-dom">—</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">Heap (MB)</div>
                            <div class="debug-metric-value" id="dm-heap">—</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">Commands</div>
                            <div class="debug-metric-value" id="dm-cmds">0</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">Uptime</div>
                            <div class="debug-metric-value" id="dm-uptime">—</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">OC Sessions</div>
                            <div class="debug-metric-value" id="dm-sessions">—</div>
                        </div>
                        <div class="debug-metric-card">
                            <div class="debug-metric-label">OC Errors</div>
                            <div class="debug-metric-value" id="dm-errors">0</div>
                        </div>
                    </div>
                    <div class="debug-section">
                        <h4>Letzte Events</h4>
                        <div class="debug-event-list" id="debug-events"></div>
                    </div>
                </div>

                <!-- Logs Tab -->
                <div class="debug-tab" id="debug-tab-logs">
                    <div class="debug-header">
                        <h3>System-Logs</h3>
                        <div style="display:flex; gap:8px;">
                            <select id="debug-log-filter" onchange="debugFilterLogs()" class="debug-select">
                                <option value="all">Alle</option>
                                <option value="system">System</option>
                                <option value="gateway">Gateway</option>
                                <option value="tool">Tools</option>
                                <option value="websocket">WebSocket</option>
                                <option value="error">Fehler</option>
                                <option value="shell">Shell</option>
                                <option value="bridge">Bridge</option>
                            </select>
                            <button onclick="debugClearLogs()" class="debug-btn">Leeren</button>
                        </div>
                    </div>
                    <div class="debug-log-container" id="debug-log-list"></div>
                </div>

                <!-- Sessions Tab -->
                <div class="debug-tab" id="debug-tab-sessions">
                    <div class="debug-header">
                        <h3>OpenClaw Sessions</h3>
                        <button onclick="debugRefreshSessions()" class="debug-btn">Aktualisieren</button>
                    </div>
                    <div class="debug-sessions-list" id="debug-sessions-list">
                        <div class="debug-empty">Nicht verbunden</div>
                    </div>
                    <div class="debug-session-detail" id="debug-session-detail" style="display:none;">
                        <div class="debug-header">
                            <h4 id="debug-session-title">Session</h4>
                            <button onclick="debugCloseSessionDetail()" class="debug-btn">Zurück</button>
                        </div>
                        <div class="debug-chat" id="debug-session-chat"></div>
                        <div class="debug-session-input-row">
                            <input type="text" id="debug-session-input" placeholder="Nachricht senden..." 
                                   class="debug-input" onkeydown="if(event.key==='Enter')debugSendToSession()">
                            <button onclick="debugSendToSession()" class="debug-btn-primary">Senden</button>
                        </div>
                    </div>
                </div>

                <!-- Scene Graph Tab -->
                <div class="debug-tab" id="debug-tab-scene">
                    <div class="debug-header">
                        <h3>Scene Graph</h3>
                        <button onclick="debugRefreshScene()" class="debug-btn">Snapshot</button>
                    </div>
                    <div class="debug-scene-tree" id="debug-scene-tree"></div>
                    <div class="debug-section">
                        <h4>Widget-Details</h4>
                        <pre class="debug-code" id="debug-widget-detail">Klicke auf ein Widget...</pre>
                    </div>
                </div>

                <!-- Performance Tab -->
                <div class="debug-tab" id="debug-tab-performance">
                    <div class="debug-header">
                        <h3>Performance</h3>
                    </div>
                    <div class="debug-section">
                        <h4>FPS History</h4>
                        <canvas id="debug-fps-canvas" width="600" height="120" style="width:100%; background:var(--debug-bg-deep); border-radius:6px;"></canvas>
                    </div>
                    <div class="debug-section">
                        <h4>Memory</h4>
                        <canvas id="debug-mem-canvas" width="600" height="120" style="width:100%; background:var(--debug-bg-deep); border-radius:6px;"></canvas>
                    </div>
                    <div class="debug-section">
                        <h4>Command History</h4>
                        <div class="debug-command-history" id="debug-cmd-history"></div>
                    </div>
                </div>

                <!-- Network Tab -->
                <div class="debug-tab" id="debug-tab-network">
                    <div class="debug-header">
                        <h3>Netzwerk</h3>
                    </div>
                    <div class="debug-section">
                        <h4>OpenClaw Gateway</h4>
                        <div class="debug-key-value" id="debug-net-gateway">
                            <div class="debug-kv-row"><span>Status:</span><span id="dn-gw-status">—</span></div>
                            <div class="debug-kv-row"><span>URL:</span><span id="dn-gw-url">—</span></div>
                            <div class="debug-kv-row"><span>WebSocket:</span><span id="dn-ws-status">—</span></div>
                            <div class="debug-kv-row"><span>Latenz:</span><span id="dn-latency">—</span></div>
                        </div>
                    </div>
                    <div class="debug-section">
                        <h4>API Calls</h4>
                        <div class="debug-log-container" id="debug-net-log"></div>
                    </div>
                </div>

                <!-- Config Tab -->
                <div class="debug-tab" id="debug-tab-config">
                    <div class="debug-header">
                        <h3>OpenClaw Config</h3>
                        <button onclick="debugLoadConfig()" class="debug-btn">Laden</button>
                    </div>
                    <pre class="debug-code debug-config-view" id="debug-config-view">Nicht geladen...</pre>
                </div>

                <!-- Console Tab -->
                <div class="debug-tab" id="debug-tab-console">
                    <div class="debug-header">
                        <h3>KI-DE Konsole</h3>
                        <button onclick="debugClearConsole()" class="debug-btn">Leeren</button>
                    </div>
                    <div class="debug-console-output" id="debug-console-output"></div>
                    <div class="debug-console-input-row">
                        <span class="debug-prompt">❯</span>
                        <input type="text" id="debug-console-input" placeholder="JavaScript oder KI-DE Befehl..." 
                               class="debug-input debug-console-in"
                               onkeydown="if(event.key==='Enter')debugExecConsole()">
                    </div>
                </div>
            </div>
        </div>
    `;
}


// ============================================
// Debug Tab Navigation
// ============================================
function debugTab(tab) {
    document.querySelectorAll('.debug-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.debug-nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`debug-tab-${tab}`)?.classList.add('active');
    document.querySelector(`.debug-nav-item[data-tab="${tab}"]`)?.classList.add('active');
}


// ============================================
// Debug Connection
// ============================================
async function debugConnect() {
    const url = document.getElementById('debug-gw-url')?.value;
    const token = document.getElementById('debug-gw-token')?.value;
    if (!url) return;

    const statusEl = document.getElementById('debug-conn-status');
    statusEl.innerHTML = '<span class="debug-dot connecting"></span> Verbinde...';

    const ok = await OpenClaw.connect(url, token);
    if (ok) {
        statusEl.innerHTML = '<span class="debug-dot connected"></span> Verbunden';
        document.getElementById('debug-connect-form').style.display = 'none';
        debugRefreshSessions();
    } else {
        statusEl.innerHTML = '<span class="debug-dot disconnected"></span> Fehler';
    }
}


// ============================================
// Debug Logs
// ============================================
let debugLogAutoScroll = true;

function debugRenderLog(entry) {
    const list = document.getElementById('debug-log-list');
    if (!list) return;

    const filter = document.getElementById('debug-log-filter')?.value || 'all';
    if (filter !== 'all' && entry.source !== filter) return;

    const colors = { info: '#94A3B8', warn: '#F59E0B', error: '#EF4444', success: '#10B981' };
    const time = entry.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 });

    const row = document.createElement('div');
    row.className = `debug-log-row debug-log-${entry.level}`;
    row.innerHTML = `
        <span class="debug-log-time">${time}</span>
        <span class="debug-log-source" style="color:${colors[entry.level] || colors.info}">[${entry.source}]</span>
        <span class="debug-log-msg">${escDebug(entry.message)}</span>
    `;

    list.appendChild(row);

    // Auto-scroll
    if (debugLogAutoScroll) list.scrollTop = list.scrollHeight;

    // Limit DOM nodes
    while (list.children.length > 500) list.removeChild(list.firstChild);
}

function debugFilterLogs() {
    const list = document.getElementById('debug-log-list');
    if (!list) return;
    list.innerHTML = '';
    const filter = document.getElementById('debug-log-filter')?.value || 'all';
    OpenClaw.logs.forEach(entry => {
        if (filter === 'all' || entry.source === filter) debugRenderLog(entry);
    });
}

function debugClearLogs() {
    OpenClaw.logs = [];
    const list = document.getElementById('debug-log-list');
    if (list) list.innerHTML = '';
}


// ============================================
// Debug Sessions
// ============================================
async function debugRefreshSessions() {
    const list = document.getElementById('debug-sessions-list');
    if (!list) return;

    const sessions = await OpenClaw.getSessions();
    if (!sessions.length) {
        list.innerHTML = '<div class="debug-empty">Keine Sessions</div>';
        return;
    }

    list.innerHTML = sessions.map(s => {
        const active = s.active ? '🟢' : '⚪';
        const model = s.model || '—';
        const label = s.label || s.sessionKey || s.id || '?';
        return `
            <div class="debug-session-row" onclick="debugOpenSession('${s.sessionKey || s.id}')">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>${active}</span>
                    <div>
                        <div style="font-weight:600;">${escDebug(label)}</div>
                        <div style="font-size:0.8rem; opacity:0.6;">${model}</div>
                    </div>
                </div>
                <div style="font-size:0.8rem; opacity:0.5;">${s.kind || ''}</div>
            </div>
        `;
    }).join('');
}

let debugActiveSessionKey = null;

async function debugOpenSession(sessionKey) {
    debugActiveSessionKey = sessionKey;
    document.getElementById('debug-sessions-list').style.display = 'none';
    document.getElementById('debug-session-detail').style.display = 'flex';
    document.getElementById('debug-session-title').textContent = sessionKey;

    const history = await OpenClaw.getSessionHistory(sessionKey);
    const chat = document.getElementById('debug-session-chat');
    if (!history?.messages?.length) {
        chat.innerHTML = '<div class="debug-empty">Keine Nachrichten</div>';
        return;
    }

    chat.innerHTML = history.messages.map(m => {
        const role = m.role === 'user' ? '👤' : m.role === 'assistant' ? '🤖' : '🔧';
        const cls = `debug-chat-msg debug-chat-${m.role}`;
        const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `<div class="${cls}"><span>${role}</span><div>${escDebug(text?.substring(0, 500))}</div></div>`;
    }).join('');

    chat.scrollTop = chat.scrollHeight;
}

function debugCloseSessionDetail() {
    document.getElementById('debug-sessions-list').style.display = '';
    document.getElementById('debug-session-detail').style.display = 'none';
    debugActiveSessionKey = null;
}

async function debugSendToSession() {
    if (!debugActiveSessionKey) return;
    const input = document.getElementById('debug-session-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const chat = document.getElementById('debug-session-chat');
    chat.innerHTML += `<div class="debug-chat-msg debug-chat-user"><span>👤</span><div>${escDebug(msg)}</div></div>`;