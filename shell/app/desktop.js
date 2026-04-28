/**
 * KI-DE Desktop Shell
 * A complete desktop environment in a web browser
 */

// ============================================
// Desktop State
// ============================================
const Desktop = {
    windows: new Map(),
    windowCounter: 0,
    activeWindow: null,
    zIndex: 100,
    theme: 'light',
    notifications: [],
    apps: {
        terminal: { name: 'Terminal', icon: '💻', color: '#0D1117' },
        files: { name: 'Dateien', icon: '📁', color: '#F59E0B' },
        browser: { name: 'Browser', icon: '🌐', color: '#3B82F6' },
        settings: { name: 'Einstellungen', icon: '⚙️', color: '#6B7280' },
        editor: { name: 'Editor', icon: '📝', color: '#10B981' },
        calculator: { name: 'Rechner', icon: '🧮', color: '#8B5CF6' },
        calendar: { name: 'Kalender', icon: '📅', color: '#EF4444' }
    },
    commandSuggestions: [
        { id: 'terminal', title: 'Terminal', desc: 'Terminal öffnen', icon: '💻' },
        { id: 'files', title: 'Dateien', desc: 'Dateimanager öffnen', icon: '📁' },
        { id: 'browser', title: 'Browser', desc: 'Webbrowser öffnen', icon: '🌐' },
        { id: 'settings', title: 'Einstellungen', desc: 'Systemeinstellungen öffnen', icon: '⚙️' },
        { id: 'editor', title: 'Editor', desc: 'Texteditor öffnen', icon: '📝' },
        { id: 'dark', title: 'Dark Mode', desc: 'Dunkles Theme aktivieren', icon: '🌙' },
        { id: 'light', title: 'Light Mode', desc: 'Helles Theme aktivieren', icon: '☀️' },
        { id: 'about', title: 'Über KI-DE', desc: 'Informationen über KI-DE', icon: '◆' }
    ]
};

// ============================================
// Window Management
// ============================================
class Window {
    constructor(appId, title, icon, content) {
        this.id = `window-${++Desktop.windowCounter}`;
        this.appId = appId;
        this.title = title;
        this.icon = icon;
        this.content = content;
        this.element = null;
        this.minimized = false;
        this.maximized = false;
        this.x = 100 + (Desktop.windowCounter % 5) * 30;
        this.y = 50 + (Desktop.windowCounter % 5) * 30;
        this.width = 800;
        this.height = 500;
        
        this.create();
        this.addToTaskbar();
    }
    
    create() {
        const win = document.createElement('div');
        win.className = 'window';
        win.id = this.id;
        win.style.left = `${this.x}px`;
        win.style.top = `${this.y}px`;
        win.style.width = `${this.width}px`;
        win.style.height = `${this.height}px`;
        win.style.zIndex = ++Desktop.zIndex;
        
        win.innerHTML = `
            <div class="window-resize-handle n"></div>
            <div class="window-resize-handle s"></div>
            <div class="window-resize-handle e"></div>
            <div class="window-resize-handle w"></div>
            <div class="window-resize-handle ne"></div>
            <div class="window-resize-handle nw"></div>
            <div class="window-resize-handle se"></div>
            <div class="window-resize-handle sw"></div>
            <div class="window-titlebar">
                <div class="window-title">
                    <span class="window-icon">${this.icon}</span>
                    <span>${this.title}</span>
                </div>
                <div class="window-controls">
                    <button class="window-btn minimize" title="Minimieren"></button>
                    <button class="window-btn maximize" title="Maximieren"></button>
                    <button class="window-btn close" title="Schließen"></button>
                </div>
            </div>
            <div class="window-content">${this.content}</div>
        `;
        
        document.getElementById('window-container').appendChild(win);
        this.element = win;
        
        // Event listeners
        this.setupEvents();
        this.focus();
        
        // Store reference
        Desktop.windows.set(this.id, this);
    }
    
    setupEvents() {
        const titlebar = this.element.querySelector('.window-titlebar');
        const minimizeBtn = this.element.querySelector('.window-btn.minimize');
        const maximizeBtn = this.element.querySelector('.window-btn.maximize');
        const closeBtn = this.element.querySelector('.window-btn.close');
        
        // Focus on click
        this.element.addEventListener('mousedown', () => this.focus());
        
        // Drag
        titlebar.addEventListener('mousedown', (e) => this.startDrag(e));
        
        // Controls
        minimizeBtn.addEventListener('click', () => this.minimize());
        maximizeBtn.addEventListener('click', () => this.toggleMaximize());
        closeBtn.addEventListener('click', () => this.close());
        
        // Resize handles
        const handles = this.element.querySelectorAll('.window-resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e, handle.classList[1]));
        });
    }
    
    startDrag(e) {
        if (this.maximized || e.target.closest('.window-controls')) return;
        
        this.focus();
        this.dragging = true;
        this.dragOffsetX = e.clientX - this.element.offsetLeft;
        this.dragOffsetY = e.clientY - this.element.offsetTop;
        
        document.addEventListener('mousemove', this.onDrag);
        document.addEventListener('mouseup', this.stopDrag);
    }
    
    onDrag = (e) => {
        if (!this.dragging) return;
        this.x = e.clientX - this.dragOffsetX;
        this.y = e.clientY - this.dragOffsetY;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    
    stopDrag = () => {
        this.dragging = false;
        document.removeEventListener('mousemove', this.onDrag);
        document.removeEventListener('mouseup', this.stopDrag);
    }
    
    startResize(e, direction) {
        e.preventDefault();
        this.resizing = true;
        this.resizeDirection = direction;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        this.resizeStartWidth = this.element.offsetWidth;
        this.resizeStartHeight = this.element.offsetHeight;
        this.resizeStartLeft = this.element.offsetLeft;
        this.resizeStartTop = this.element.offsetTop;
        
        document.addEventListener('mousemove', this.onResize);
        document.addEventListener('mouseup', this.stopResize);
    }
    
    onResize = (e) => {
        if (!this.resizing) return;
        
        const dx = e.clientX - this.resizeStartX;
        const dy = e.clientY - this.resizeStartY;
        
        if (this.resizeDirection.includes('e')) {
            this.width = Math.max(300, this.resizeStartWidth + dx);
            this.element.style.width = `${this.width}px`;
        }
        if (this.resizeDirection.includes('s')) {
            this.height = Math.max(200, this.resizeStartHeight + dy);
            this.element.style.height = `${this.height}px`;
        }
        if (this.resizeDirection.includes('w')) {
            const newWidth = Math.max(300, this.resizeStartWidth - dx);
            this.x = this.resizeStartLeft + this.resizeStartWidth - newWidth;
            this.width = newWidth;
            this.element.style.left = `${this.x}px`;
            this.element.style.width = `${this.width}px`;
        }
        if (this.resizeDirection.includes('n')) {
            const newHeight = Math.max(200, this.resizeStartHeight - dy);
            this.y = this.resizeStartTop + this.resizeStartHeight - newHeight;
            this.height = newHeight;
            this.element.style.top = `${this.y}px`;
            this.element.style.height = `${this.height}px`;
        }
    }
    
    stopResize = () => {
        this.resizing = false;
        document.removeEventListener('mousemove', this.onResize);
        document.removeEventListener('mouseup', this.stopResize);
    }
    
    focus() {
        // Unfocus all windows
        Desktop.windows.forEach(w => {
            w.element.classList.add('inactive');
            w.element.style.zIndex = 100;
        });
        
        // Focus this window
        this.element.classList.remove('inactive');
        this.element.style.zIndex = ++Desktop.zIndex;
        Desktop.activeWindow = this;
        
        // Update taskbar
        document.querySelectorAll('.taskbar-app').forEach(btn => btn.classList.remove('active'));
        const taskbarBtn = document.querySelector(`.taskbar-app[data-window="${this.id}"]`);
        if (taskbarBtn) taskbarBtn.classList.add('active');
        
        // Update title
        document.getElementById('active-window-title').textContent = this.title;
    }
    
    minimize() {
        this.minimized = true;
        this.element.classList.add('minimized');
        document.querySelector(`.taskbar-app[data-window="${this.id}"]`).classList.remove('active');
        
        // Find next window to focus
        const visibleWindows = Array.from(Desktop.windows.values()).filter(w => !w.minimized && w.id !== this.id);
        if (visibleWindows.length > 0) {
            visibleWindows[visibleWindows.length - 1].focus();
        } else {
            document.getElementById('active-window-title').textContent = '';
        }
    }
    
    restore() {
        this.minimized = false;
        this.element.classList.remove('minimized');
        this.focus();
    }
    
    toggleMaximize() {
        this.maximized = !this.maximized;
        this.element.classList.toggle('maximized', this.maximized);
    }
    
    close() {
        this.element.remove();
        Desktop.windows.delete(this.id);
        
        // Remove from taskbar
        const taskbarBtn = document.querySelector(`.taskbar-app[data-window="${this.id}"]`);
        if (taskbarBtn) taskbarBtn.remove();
        
        // Focus next window
        if (Desktop.activeWindow === this) {
            const remaining = Array.from(Desktop.windows.values()).filter(w => !w.minimized);
            if (remaining.length > 0) {
                remaining[remaining.length - 1].focus();
            } else {
                document.getElementById('active-window-title').textContent = '';
            }
        }
    }
    
    addToTaskbar() {
        const btn = document.createElement('button');
        btn.className = 'taskbar-app active';
        btn.dataset.window = this.id;
        btn.innerHTML = this.icon;
        btn.title = this.title;
        
        btn.addEventListener('click', () => {
            if (this.minimized || Desktop.activeWindow !== this) {
                this.restore();
            } else {
                this.minimize();
            }
        });
        
        document.getElementById('taskbar-apps').appendChild(btn);
    }
}

// ============================================
// App Content Generators
// ============================================
const AppContent = {
    terminal() {
        const id = `terminal-${Date.now()}`;
        return `
            <div class="terminal-container" id="${id}">
                <div class="terminal-output">Willkommen im KI-DE Terminal v1.0
Type 'help' für verfügbare Befehle.</div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt">user@kide:~$</span>
                    <input type="text" class="terminal-input" autofocus autocomplete="off">
                </div>
            </div>
            <script>
                (function() {
                    const container = document.getElementById('${id}');
                    const input = container.querySelector('.terminal-input');
                    const output = container.querySelector('.terminal-output');
                    
                    const commands = {
                        help: () => 'Verfügbare Befehle:\n  help      - Diese Hilfe\n  clear     - Terminal leeren\n  date      - Aktuelles Datum\n  whoami    - Aktueller Benutzer\n  uname     - Systeminformationen\n  echo      - Text ausgeben\n  calc      - Rechner (z.B. calc 2+2)\n  about     - Über KI-DE\n  debug     - Debug-Tool öffnen\n  oc        - OpenClaw Status\n  scene     - Scene Graph anzeigen\n  windows   - Offene Fenster\n  open      - App öffnen (z.B. open browser)',
                        clear: () => { output.innerHTML = ''; return ''; },
                        date: () => new Date().toLocaleString('de-DE'),
                        whoami: () => 'user',
                        uname: () => 'KI-DE OS v1.0 (openPlank)\nKernel: Linux 6.x kide\nArch: x86_64\nDesktop: KI-DE Phase 1 (Chromium Kiosk)\nOpenClaw: ' + (OpenClaw.connected ? 'Verbunden' : 'Nicht verbunden'),
                        echo: (args) => args.join(' '),
                        calc: (args) => {
                            try {
                                return eval(args.join('')) + '';
                            } catch {
                                return 'Fehler: Ungültiger Ausdruck';
                            }
                        },
                        about: () => 'KI-DE Desktop Environment v1.0\nEin Projekt von openPlank OS\nOpenClaw: ' + (OpenClaw.connected ? '✅ Verbunden' : '❌ Nicht verbunden'),
                        debug: () => { openApp('debug'); return '🔧 Debug-Tool geöffnet'; },
                        oc: () => {
                            if (!OpenClaw.connected) return '❌ OpenClaw nicht verbunden\nVerbinde über Debug-App (F12)';
                            return '✅ OpenClaw Gateway: ' + OpenClaw.gateway.url
                                + '\nSessions: ' + OpenClaw.sessions.length
                                + '\nErrors: ' + OpenClaw.metrics.errors.length
                                + '\nLogs: ' + OpenClaw.logs.length;
                        },
                        scene: () => {
                            const wins = [...Desktop.windows.values()];
                            return 'Scene Graph — ' + wins.length + ' Fenster:\n' + wins.map(w =>
                                '  ' + w.icon + ' ' + w.title + ' [' + w.id + '] ' +
                                (w.minimized ? '(minimiert)' : w.maximized ? '(maximiert)' : Math.round(w.x)+','+Math.round(w.y)+' '+w.width+'×'+w.height)
                            ).join('\n');
                        },
                        windows: () => {
                            const wins = [...Desktop.windows.values()];
                            if (!wins.length) return 'Keine offenen Fenster';
                            return wins.map(w => w.id + '  ' + w.icon + ' ' + w.title).join('\n');
                        },
                        open: (args) => {
                            const appId = args[0];
                            if (Desktop.apps[appId]) { openApp(appId); return '✅ ' + Desktop.apps[appId].name + ' geöffnet'; }
                            return 'Unbekannte App: ' + (appId || '?') + '\nVerfügbar: ' + Object.keys(Desktop.apps).join(', ');
                        }
                    };
                    
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            const cmdLine = input.value.trim();
                            if (!cmdLine) return;
                            
                            output.innerHTML += '\n<span class="terminal-prompt">user@kide:~$</span> ' + cmdLine;
                            
                            const parts = cmdLine.split(' ');
                            const cmd = parts[0];
                            const args = parts.slice(1);
                            
                            if (commands[cmd]) {
                                const result = commands[cmd](args);
                                if (result) output.innerHTML += '\n' + result;
                            } else {
                                output.innerHTML += '\n<span class="terminal-error">Befehl nicht gefunden: ' + cmd + '</span>';
                            }
                            
                            input.value = '';
                            container.scrollTop = container.scrollHeight;
                        }
                    });
                    
                    input.focus();
                })();
            </script>
        `;
    },
    
    files() {
        const files = [
            { name: 'Dokumente', icon: '📁', type: 'folder' },
            { name: 'Bilder', icon: '📁', type: 'folder' },
            { name: 'Downloads', icon: '📁', type: 'folder' },
            { name: 'Projekte', icon: '📁', type: 'folder' },
            { name: 'README.txt', icon: '📄', type: 'file' },
            { name: 'Notizen.md', icon: '📝', type: 'file' },
            { name: 'Logo.svg', icon: '🎨', type: 'file' },
            { name: 'Daten.json', icon: '📋', type: 'file' }
        ];
        
        return `
            <div class="file-manager">
                <div class="file-toolbar">
                    <button class="file-toolbar-btn">⬅️ Zurück</button>
                    <button class="file-toolbar-btn">🏠 Home</button>
                    <input type="text" class="file-path" value="/home/user" readonly>
                    <button class="file-toolbar-btn">➕ Neu</button>
                </div>
                <div class="file-grid">
                    ${files.map(f => `
                        <div class="file-item">
                            <div class="file-icon">${f.icon}</div>
                            <div class="file-name">${f.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    browser() {
        return `
            <div class="browser-container">
                <div class="browser-toolbar">
                    <button class="browser-nav-btn">⬅️</button>
                    <button class="browser-nav-btn">➡️</button>
                    <button class="browser-nav-btn">🔄</button>
                    <input type="text" class="browser-address" value="about:blank" placeholder="URL eingeben...">
                </div>
                <iframe class="browser-frame" src="about:blank"></iframe>
            </div>
            <script>
                (function() {
                    const address = document.querySelector('.browser-address');
                    const frame = document.querySelector('.browser-frame');
                    
                    address.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            let url = address.value.trim();
                            if (!url.startsWith('http')) {
                                url = 'https://' + url;
                            }
                            frame.src = url;
                        }
                    });
                })();
            </script>
        `;
    },
    
    settings() {
        return `
            <div class="settings-container">
                <div class="settings-section">
                    <div class="settings-section-title">Erscheinungsbild</div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <span class="settings-item-title">Dunkles Theme</span>
                            <span class="settings-item-desc">Dunkles Erscheinungsbild aktivieren</span>
                        </div>
                        <div class="toggle ${Desktop.theme === 'dark' ? 'active' : ''}" id="theme-toggle"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <span class="settings-item-title">Hintergrund</span>
                            <span class="settings-item-desc">Desktop-Hintergrund wählen</span>
                        </div>
                    </div>
                    <div class="wallpaper-grid">
                        <div class="wallpaper-option active" style="background: linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 50%, #ECFDF5 100%)"></div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #0F172A 0%, #1A1A2E 50%, #0F172A 100%)"></div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #5B9AA0 0%, #7DD3FC 100%)"></div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"></div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"></div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"></div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">System</div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <span class="settings-item-title">KI-DE Version</span>
                            <span class="settings-item-desc">1.0.0 (Phase 1 MVP)</span>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <span class="settings-item-title">Über KI-DE</span>
                            <span class="settings-item-desc">KI-DE ist ein experimentelles Desktop Environment\nfür KI-gestützte Entwicklung.</span>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                (function() {
                    const themeToggle = document.getElementById('theme-toggle');
                    themeToggle.addEventListener('click', () => {
                        toggleTheme();
                        themeToggle.classList.toggle('active');
                    });
                    
                    document.querySelectorAll('.wallpaper-option').forEach(opt => {
                        opt.addEventListener('click', function() {
                            document.querySelectorAll('.wallpaper-option').forEach(o => o.classList.remove('active'));
                            this.classList.add('active');
                            document.getElementById('desktop-bg').style.background = this.style.background;
                        });
                    });
                })();
            </script>
        `;
    },
    
    editor() {
        return `
            <div class="editor-container">
                <div class="editor-toolbar">
                    <button class="file-toolbar-btn">📄 Neu</button>
                    <button class="file-toolbar-btn">💾 Speichern</button>
                    <button class="file-toolbar-btn">📂 Öffnen</button>
                </div>
                <textarea class="editor-textarea" placeholder="Beginne zu tippen..."></textarea>
            </div>
        `;
    },

    debug() {
        // OpenClaw Debug System — tief verankertes Diagnose-Tool
        return buildDebugApp();
    }
};

// ============================================
// Desktop Functions
// ============================================
function openApp(appId) {
    const app = Desktop.apps[appId];
    if (!app) return;
    
    const content = AppContent[appId] ? AppContent[appId]() : '<div style="padding:40px;text-align:center">🚧 App in Entwicklung</div>';
    const win = new Window(appId, app.name, app.icon, content);
    
    // Debug app: open larger
    if (appId === 'debug' && win.element) {
        win.width = Math.min(1100, window.innerWidth - 80);
        win.height = Math.min(700, window.innerHeight - 120);
        win.x = Math.max(20, (window.innerWidth - win.width) / 2);
        win.y = Math.max(20, (window.innerHeight - win.height) / 2 - 30);
        win.element.style.width = win.width + 'px';
        win.element.style.height = win.height + 'px';
        win.element.style.left = win.x + 'px';
        win.element.style.top = win.y + 'px';
    }
    
    // Close launcher if open
    document.getElementById('app-launcher').classList.add('hidden');
}

function toggleTheme() {
    Desktop.theme = Desktop.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', Desktop.theme);
    
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = Desktop.theme === 'light' ? '🌙' : '☀️';
    
    // Update desktop bg
    if (Desktop.theme === 'dark') {
        document.getElementById('desktop-bg').style.background = 'linear-gradient(135deg, #0F172A 0%, #1A1A2E 50%, #0F172A 100%)';
    } else {
        document.getElementById('desktop-bg').style.background = '#E8EDF2';
    }
}

function showNotification(title, text, icon = '🔔') {
    const notif = { id: Date.now(), title, text, icon, time: new Date() };
    Desktop.notifications.push(notif);
    
    updateNotificationBadge();
    renderNotifications();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const count = Desktop.notifications.length;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}

function renderNotifications() {
    const list = document.getElementById('notification-list');
    
    if (Desktop.notifications.length === 0) {
        list.innerHTML = '<div class="no-notifications">Keine Benachrichtigungen</div>';
        return;
    }
    
    list.innerHTML = Desktop.notifications.map(n => `
        <div class="notification">
            <div class="notification-icon">${n.icon}</div>
            <div class="notification-content">
                <div class="notification-title">${n.title}</div>
                <div class="notification-text">${n.text}</div>
                <div class="notification-time">${n.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        </div>
    `).reverse().join('');
}

// ============================================
// Command Bar
// ============================================
function showCommandBar() {
    const bar = document.getElementById('command-bar');
    const input = document.getElementById('command-input');
    bar.classList.remove('hidden');
    input.value = '';
    input.focus();
    renderCommandSuggestions('');
}

function hideCommandBar() {
    document.getElementById('command-bar').classList.add('hidden');
}

function renderCommandSuggestions(query) {
    const container = document.getElementById('command-suggestions');
    const filtered = Desktop.commandSuggestions.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.desc.toLowerCase().includes(query.toLowerCase())
    );
    
    container.innerHTML = filtered.map((s, i) => `
        <div class="command-suggestion ${i === 0 ? 'selected' : ''}" data-id="${s.id}">
            <div class="command-suggestion-icon">${s.icon}</div>
            <div class="command-suggestion-text">
                <div class="command-suggestion-title">${s.title}</div>
                <div class="command-suggestion-desc">${s.desc}</div>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.command-suggestion').forEach(el => {
        el.addEventListener('click', () => executeCommand(el.dataset.id));
    });
}

function executeCommand(cmd) {
    hideCommandBar();
    
    switch(cmd) {
        case 'dark':
            if (Desktop.theme !== 'dark') toggleTheme();
            break;
        case 'light':
            if (Desktop.theme !== 'light') toggleTheme();
            break;
        case 'about':
            showNotification('KI-DE Desktop', 'Version 1.0.0 - Phase 1 MVP', '◆');
            break;
        default:
            if (Desktop.apps[cmd]) openApp(cmd);
    }
}

// ============================================
// App Launcher
// ============================================
function showLauncher() {
    const launcher = document.getElementById('app-launcher');
    const grid = document.getElementById('launcher-grid');
    const search = document.getElementById('launcher-search');
    
    grid.innerHTML = Object.entries(Desktop.apps).map(([id, app]) => `
        <div class="launcher-item" data-app="${id}">
            <div class="launcher-item-icon">${app.icon}</div>
            <div class="launcher-item-name">${app.name}</div>
        </div>
    `).join('');
    
    grid.querySelectorAll('.launcher-item').forEach(item => {
        item.addEventListener('click', () => openApp(item.dataset.app));
    });
    
    launcher.classList.remove('hidden');
    search.value = '';
    search.focus();
}

function hideLauncher() {
    document.getElementById('app-launcher').classList.add('hidden');
}

// ============================================
// Clock
// ============================================
function updateClock() {
    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').textContent = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============================================
// Event Listeners
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Desktop icons
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', () => openApp(icon.dataset.app));
    });
    
    // Taskbar buttons
    document.getElementById('launcher-btn').addEventListener('click', showLauncher);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    
    // Notifications
    document.getElementById('notifications-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notification-panel').classList.toggle('hidden');
    });
    
    document.getElementById('clear-notifications').addEventListener('click', () => {
        Desktop.notifications = [];
        updateNotificationBadge();
        renderNotifications();
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#notification-panel') && !e.target.closest('#notifications-btn')) {
            document.getElementById('notification-panel').classList.add('hidden');
        }
    });
    
    // Command Bar
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
            e.preventDefault();
            showCommandBar();
        }
        if (e.code === 'Escape') {
            hideCommandBar();
            hideLauncher();
        }
        // F12 or Ctrl+Shift+D: Open Debug
        if (e.code === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyD')) {
            e.preventDefault();
            openApp('debug');
        }
    });
    
    document.querySelector('.command-bar-overlay').addEventListener('click', hideCommandBar);
    
    const commandInput = document.getElementById('command-input');
    commandInput.addEventListener('input', (e) => renderCommandSuggestions(e.target.value));
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const selected = document.querySelector('.command-suggestion.selected');
            if (selected) executeCommand(selected.dataset.id);
        }
    });
    
    // Launcher
    document.querySelector('.launcher-overlay').addEventListener('click', hideLauncher);
    
    const launcherSearch = document.getElementById('launcher-search');
    launcherSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.launcher-item').forEach(item => {
            const app = Desktop.apps[item.dataset.app];
            item.style.display = app.name.toLowerCase().includes(query) ? '' : 'none';
        });
    });
    
    // Initial notification
    setTimeout(() => {
        showNotification('Willkommen!', 'KI-DE Desktop ist bereit. Super+Space für die Command Bar.', '◆');
    }, 500);
});
