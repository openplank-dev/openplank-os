/**
 * KI-DE — WebXR AR Client
 * 
 * Läuft im Browser der AR-Brille.
 * Verbindet sich mit dem KI-DE Desktop und rendert Widgets als AR-Overlays.
 * 
 * Kompatibilität:
 * - Meta Quest Browser (WebXR AR)
 * - Safari auf Vision Pro (WebXR)
 * - Chrome auf Android (WebXR AR)
 * - Jeder WebXR-fähige Browser
 * 
 * Verbindung:
 * 1. User öffnet https://kide-host:3001/ar auf der Brille
 * 2. WebSocket-Verbindung zum KI-DE Server
 * 3. Empfängt Widget-Updates + HUD-Elemente
 * 4. Rendert sie als AR Overlays via WebXR
 * 5. Sendet Voice Commands + Gaze Data zurück
 */

// ============================================
// WebXR Session Setup
// ============================================

export interface WebXRConfig {
    serverUrl: string;
    token: string;
    deviceName: string;
    features: ('hit-test' | 'anchors' | 'hand-tracking' | 'eye-tracking')[];
    renderScale: number;    // 1.0 = native, 0.5 = half
}

export class WebXRClient {
    private config: WebXRConfig;
    private ws: WebSocket | null = null;
    private xrSession: XRSession | null = null;
    private xrRefSpace: XRReferenceSpace | null = null;
    private gl: WebGLRenderingContext | null = null;
    private hudElements: Map<string, any> = new Map();
    private connected: boolean = false;

    constructor(config: WebXRConfig) {
        this.config = config;
    }

    // ---- WebXR Feature Detection ----

    static async isSupported(): Promise<{
        immersiveAR: boolean;
        immersiveVR: boolean;
        inline: boolean;
    }> {
        if (!navigator.xr) {
            return { immersiveAR: false, immersiveVR: false, inline: true };
        }
        
        const [ar, vr] = await Promise.all([
            navigator.xr.isSessionSupported('immersive-ar').catch(() => false),
            navigator.xr.isSessionSupported('immersive-vr').catch(() => false),
        ]);
        
        return { immersiveAR: ar, immersiveVR: vr, inline: true };
    }

    // ---- Connection to KI-DE Server ----

    async connect(): Promise<boolean> {
        const wsUrl = this.config.serverUrl.replace(/^http/, 'ws') + '/ar/ws';
        
        return new Promise((resolve) => {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                // Authenticate
                this.ws!.send(JSON.stringify({
                    type: 'auth',
                    token: this.config.token,
                    device: {
                        name: this.config.deviceName,
                        type: 'webxr',
                        capabilities: this.detectCapabilities(),
                    },
                }));
                
                this.connected = true;
                console.log('[AR] Verbunden mit KI-DE Server');
                resolve(true);
            };
            
            this.ws.onmessage = (event) => {
                this.handleServerMessage(JSON.parse(event.data));
            };
            
            this.ws.onerror = () => {
                console.error('[AR] WebSocket Fehler');
                resolve(false);
            };
            
            this.ws.onclose = () => {
                this.connected = false;
                console.log('[AR] Verbindung getrennt');
                // Auto-reconnect nach 3s
                setTimeout(() => this.connect(), 3000);
            };
        });
    }

    // ---- Server Message Handler ----

    private handleServerMessage(msg: any): void {
        switch (msg.type) {
            case 'auth_ok':
                console.log('[AR] Authentifiziert als:', msg.viewportId);
                break;
            
            case 'hud_update':
                this.hudElements.set(msg.element.id, msg.element);
                this.renderHUD();
                break;
            
            case 'hud_remove':
                this.hudElements.delete(msg.elementId);
                this.renderHUD();
                break;
            
            case 'hud_clear':
                this.hudElements.clear();
                this.renderHUD();
                break;
            
            case 'widget_data':
                // Widget-Daten für AR-Rendering
                this.renderWidget(msg.widget);
                break;
            
            case 'theme_change':
                this.applyTheme(msg.theme);
                break;
            
            case 'speak':
                this.speak(msg.text);
                break;
            
            case 'notification':
                this.showARNotification(msg.title, msg.text, msg.priority);
                break;
        }
    }

    // ---- WebXR Session ----

    async startARSession(): Promise<boolean> {
        if (!navigator.xr) {
            console.error('[AR] WebXR nicht verfügbar');
            return false;
        }

        try {
            const sessionInit: XRSessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: this.config.features,
            };

            // Versuche AR, dann VR
            try {
                this.xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
            } catch {
                this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
            }

            this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');
            
            // Render loop
            this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
            
            this.xrSession.addEventListener('end', () => {
                this.xrSession = null;
                console.log('[AR] XR Session beendet');
            });

            console.log('[AR] XR Session gestartet');
            return true;
        } catch (e) {
            console.error('[AR] XR Session Fehler:', e);
            return false;
        }
    }

    // ---- Render Loop ----

    private onXRFrame(time: DOMHighResTimeStamp, frame: XRFrame): void {
        if (!this.xrSession) return;
        
        this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
        
        const pose = frame.getViewerPose(this.xrRefSpace!);
        if (!pose) return;
        
        // Render HUD elements relative to viewer
        for (const view of pose.views) {
            this.renderHUDToView(view, time);
        }
    }

    // ---- HUD Rendering ----

    private renderHUD(): void {
        // DOM-basiertes HUD-Rendering (Phase 1)
        // In Phase 3 wird das durch WebGL ersetzt
        const container = document.getElementById('ar-hud');
        if (!container) return;

        container.innerHTML = '';
        
        for (const element of this.hudElements.values()) {
            if (!element.visible) continue;
            
            // Auto-expire
            if (element.expiresAt && Date.now() > element.expiresAt) {
                this.hudElements.delete(element.id);
                continue;
            }

            const el = document.createElement('div');
            el.className = `ar-hud-element ar-hud-${element.type} ar-hud-pos-${element.position} ar-hud-priority-${element.priority}`;
            if (element.animateIn) el.classList.add(`ar-animate-${element.animateIn}`);
            
            el.innerHTML = this.renderHUDElement(element);
            container.appendChild(el);
        }
    }

    private renderHUDElement(element: any): string {
        switch (element.type) {
            case 'text':
                return `<div class="ar-hud-text">${element.content.text}</div>`;
            
            case 'notification':
                return `
                    <div class="ar-hud-notification">
                        <div class="ar-hud-notif-title">${element.content.title}</div>
                        <div class="ar-hud-notif-text">${element.content.text}</div>
                    </div>`;
            
            case 'timer':
                return `
                    <div class="ar-hud-timer">
                        <span class="ar-hud-timer-value">${element.content.remaining || element.content.duration}</span>
                        <span class="ar-hud-timer-unit">${element.content.unit || 'min'}</span>
                    </div>`;
            
            case 'status_bar':
                return `
                    <div class="ar-hud-status">
                        ${element.content.items?.map((i: any) => 
                            `<span class="ar-hud-status-item">${i.icon} ${i.value}</span>`
                        ).join('') || ''}
                    </div>`;
            
            case 'badge':
                return `<div class="ar-hud-badge">${element.content.icon} ${element.content.count}</div>`;
            
            case 'card':
                return `
                    <div class="ar-hud-card">
                        <div class="ar-hud-card-title">${element.content.title}</div>
                        <div class="ar-hud-card-body">${element.content.body}</div>
                    </div>`;
            
            default:
                return `<div>${JSON.stringify(element.content)}</div>`;
        }
    }

    private renderHUDToView(view: XRView, time: number): void {
        // WebGL HUD rendering (Phase 3)
        // For now, DOM overlay is used
    }

    // ---- Widget Rendering ----

    private renderWidget(widget: any): void {
        // Render a desktop widget as an AR panel
        const container = document.getElementById('ar-widgets');
        if (!container) return;

        let el = document.getElementById(`ar-widget-${widget.id}`);
        if (!el) {
            el = document.createElement('div');
            el.id = `ar-widget-${widget.id}`;
            el.className = 'ar-widget-panel';
            container.appendChild(el);
        }

        el.innerHTML = `
            <div class="ar-widget-titlebar">
                <span>${widget.icon || '📦'} ${widget.label || widget.id}</span>
                <button onclick="this.closest('.ar-widget-panel').remove()">✕</button>
            </div>
            <div class="ar-widget-content">${widget.html || JSON.stringify(widget.data, null, 2)}</div>
        `;
    }

    // ---- Voice Commands ----

    async startVoiceRecognition(): Promise<void> {
        // @ts-ignore — SpeechRecognition may not be typed
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[AR] SpeechRecognition nicht verfügbar');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                const text = result[0].transcript.trim();
                const confidence = result[0].confidence;
                
                console.log(`[AR] Voice: "${text}" (${Math.round(confidence * 100)}%)`);
                
                // Send to server
                this.sendVoiceCommand(text, confidence);
            }
        };

        recognition.onerror = (event: any) => {
            console.warn('[AR] Voice error:', event.error);
            // Restart on error
            if (event.error !== 'aborted') {
                setTimeout(() => recognition.start(), 1000);
            }
        };

        recognition.onend = () => {
            // Auto-restart
            recognition.start();
        };

        recognition.start();
        console.log('[AR] Voice Recognition gestartet');
    }

    private sendVoiceCommand(text: string, confidence: number): void {
        if (!this.ws || !this.connected) return;
        this.ws.send(JSON.stringify({
            type: 'voice_command',
            text,
            confidence,
            timestamp: Date.now(),
        }));
    }

    // ---- TTS (Sprach-Output) ----

    private speak(text: string): void {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }

    // ---- Notification ----

    private showARNotification(title: string, text: string, priority: string): void {
        this.updateHUDElement({
            id: `notif-${Date.now()}`,
            type: 'notification',
            position: 'top-right',
            priority: priority as any,
            content: { title, text },
            visible: true,
            expiresAt: Date.now() + 8000,
            animateIn: 'slide',
        });
    }

    private updateHUDElement(element: any): void {
        this.hudElements.set(element.id, element);
        this.renderHUD();
    }

    // ---- Theme ----

    private applyTheme(theme: any): void {
        const root = document.documentElement;
        if (theme.tokens) {
            for (const [key, value] of Object.entries(theme.tokens)) {
                root.style.setProperty(key, value as string);
            }
        }
    }

    // ---- Helpers ----

    private detectCapabilities(): string[] {
        const caps: string[] = ['display'];
        if (window.SpeechRecognition || (window as any).webkitSpeechRecognition) caps.push('voice_input');
        if (navigator.xr) caps.push('6dof');
        return caps;
    }

    // ---- Cleanup ----

    async disconnect(): Promise<void> {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}
