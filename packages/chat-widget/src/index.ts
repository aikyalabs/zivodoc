import { STYLES } from './styles.js';

interface Citation {
  source: string;
  anchor: string | null;
  headingPath: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

interface WidgetConfig {
  projectId: string;
  apiUrl: string;
  title: string;
  greeting: string;
  position: 'bottom-right' | 'bottom-left';
  theme: 'auto' | 'light' | 'dark';
  accent?: string;
}

const DEFAULT_API = 'https://api.zivodoc.com';

function readConfig(script: HTMLScriptElement): WidgetConfig {
  const ds = script.dataset;
  if (!ds.project) throw new Error('zivodoc-chat: data-project attribute is required');
  return {
    projectId: ds.project,
    apiUrl: ds.api ?? DEFAULT_API,
    title: ds.title ?? 'Ask the docs',
    greeting: ds.greeting ?? 'Hi! Ask anything about these docs.',
    position: (ds.position as WidgetConfig['position']) ?? 'bottom-right',
    theme: (ds.theme as WidgetConfig['theme']) ?? 'auto',
    accent: ds.accent,
  };
}

function applyTheme(host: HTMLElement, theme: WidgetConfig['theme']): void {
  const dark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) {
    host.style.setProperty('--zd-bg', '#0a0a0a');
    host.style.setProperty('--zd-fg', '#fafafa');
    host.style.setProperty('--zd-border', '#262626');
    host.style.setProperty('--zd-muted', '#a3a3a3');
    host.style.setProperty('--zd-msg-bg', '#171717');
    host.style.setProperty('--zd-accent', '#fafafa');
  } else {
    host.style.setProperty('--zd-accent', '#0a0a0a');
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

class ChatWidget {
  private cfg: WidgetConfig;
  private root: HTMLDivElement;
  private panel: HTMLDivElement | null = null;
  private messagesEl: HTMLDivElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private messages: Message[] = [];
  private sessionId: string | null = null;
  private streaming = false;

  constructor(cfg: WidgetConfig) {
    this.cfg = cfg;
    this.root = el('div', 'zd-root');
    if (cfg.accent) this.root.style.setProperty('--zd-accent', cfg.accent);
    applyTheme(this.root, cfg.theme);

    const style = document.createElement('style');
    style.textContent = STYLES;
    this.root.appendChild(style);

    this.root.appendChild(this.makeFab());
    document.body.appendChild(this.root);
  }

  private makeFab(): HTMLButtonElement {
    const btn = el('button', 'zd-fab');
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.onclick = () => this.openPanel();
    return btn;
  }

  private async openPanel(): Promise<void> {
    if (this.panel) {
      this.panel.style.display = 'flex';
      this.inputEl?.focus();
      return;
    }
    this.panel = this.makePanel();
    this.root.appendChild(this.panel);
    this.inputEl?.focus();
    if (!this.sessionId) await this.createSession();
  }

  private closePanel(): void {
    if (this.panel) this.panel.style.display = 'none';
  }

  private makePanel(): HTMLDivElement {
    const panel = el('div', 'zd-panel');

    const header = el('div', 'zd-header');
    header.appendChild(el('div', 'zd-title', this.cfg.title));
    const close = el('button', 'zd-close');
    close.setAttribute('aria-label', 'Close chat');
    close.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    close.onclick = () => this.closePanel();
    header.appendChild(close);
    panel.appendChild(header);

    this.messagesEl = el('div', 'zd-messages');
    const empty = el('div', 'zd-empty', this.cfg.greeting);
    this.messagesEl.appendChild(empty);
    panel.appendChild(this.messagesEl);

    const form = el('form', 'zd-form');
    this.inputEl = el('input', 'zd-input');
    this.inputEl.placeholder = 'Ask a question…';
    this.inputEl.autocomplete = 'off';
    this.sendBtn = el('button', 'zd-send', 'Send');
    this.sendBtn.type = 'submit';
    form.appendChild(this.inputEl);
    form.appendChild(this.sendBtn);
    form.onsubmit = (e) => {
      e.preventDefault();
      void this.handleSend();
    };
    panel.appendChild(form);

    const footer = el('div', 'zd-footer');
    const link = el('a', undefined, 'Powered by zivodoc');
    link.href = 'https://zivodoc.com';
    link.target = '_blank';
    link.rel = 'noopener';
    footer.appendChild(link);
    panel.appendChild(footer);

    return panel;
  }

  private async createSession(): Promise<void> {
    try {
      const res = await fetch(
        `${this.cfg.apiUrl}/chat/projects/${encodeURIComponent(this.cfg.projectId)}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl: window.location.href }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { sessionId: string };
      this.sessionId = data.sessionId;
    } catch (err) {
      this.showError(`Couldn't start a chat session. ${err instanceof Error ? err.message : ''}`);
    }
  }

  private async handleSend(): Promise<void> {
    if (this.streaming) return;
    const input = this.inputEl;
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;
    if (!this.sessionId) await this.createSession();
    if (!this.sessionId) return;

    input.value = '';
    this.streaming = true;
    if (this.sendBtn) this.sendBtn.disabled = true;
    if (this.inputEl) this.inputEl.disabled = true;

    this.appendMessage({ role: 'user', content: question });
    const assistant: Message = { role: 'assistant', content: '', pending: true };
    this.appendMessage(assistant);

    try {
      const res = await fetch(
        `${this.cfg.apiUrl}/chat/sessions/${encodeURIComponent(this.sessionId)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ question }),
        },
      );
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      await this.consumeSse(res.body, assistant);
    } catch (err) {
      assistant.content = `Sorry — ${err instanceof Error ? err.message : 'something went wrong.'}`;
      assistant.pending = false;
      this.rerenderLast();
    } finally {
      this.streaming = false;
      if (this.sendBtn) this.sendBtn.disabled = false;
      if (this.inputEl) {
        this.inputEl.disabled = false;
        this.inputEl.focus();
      }
    }
  }

  private async consumeSse(stream: ReadableStream<Uint8Array>, target: Message): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const block of events) {
        const lines = block.split('\n');
        let event = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) event = line.slice(7);
          else if (line.startsWith('data: ')) data += line.slice(6);
        }
        if (!data) continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        if (event === 'token' && typeof parsed === 'string') {
          target.content += parsed;
          target.pending = true;
          this.rerenderLast();
        } else if (event === 'citations' && Array.isArray(parsed)) {
          target.citations = parsed as Citation[];
          this.rerenderLast();
        } else if (event === 'done') {
          target.pending = false;
          this.rerenderLast();
          return;
        } else if (event === 'error') {
          target.content = typeof parsed === 'string' ? parsed : 'Error generating response.';
          target.pending = false;
          this.rerenderLast();
          return;
        }
      }
    }
  }

  private appendMessage(msg: Message): void {
    if (!this.messagesEl) return;
    if (this.messages.length === 0) {
      const empty = this.messagesEl.querySelector('.zd-empty');
      if (empty) empty.remove();
    }
    this.messages.push(msg);
    this.renderMessage(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private renderMessage(msg: Message): void {
    if (!this.messagesEl) return;
    const node = el('div', `zd-msg zd-msg-${msg.role}`);
    node.dataset.role = msg.role;
    this.applyMessageContent(node, msg);
    this.messagesEl.appendChild(node);
  }

  private applyMessageContent(node: HTMLElement, msg: Message): void {
    node.textContent = msg.content;
    if (msg.pending) {
      const cursor = el('span', 'zd-cursor');
      node.appendChild(cursor);
    }
    if (msg.citations && msg.citations.length > 0) {
      const wrap = el('div', 'zd-citations');
      msg.citations.forEach((c, i) => {
        const link = el('a', 'zd-cite', `[${i + 1}] ${c.headingPath ?? c.source}`);
        link.href = c.source;
        link.target = '_blank';
        link.rel = 'noopener';
        wrap.appendChild(link);
      });
      node.appendChild(wrap);
    }
  }

  private rerenderLast(): void {
    if (!this.messagesEl) return;
    const last = this.messages[this.messages.length - 1];
    const nodes = this.messagesEl.querySelectorAll('.zd-msg');
    const node = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (!node || !last) return;
    node.textContent = '';
    this.applyMessageContent(node, last);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private showError(message: string): void {
    if (!this.messagesEl) return;
    const node = el('div', 'zd-empty', message);
    this.messagesEl.innerHTML = '';
    this.messagesEl.appendChild(node);
  }
}

function autoMount(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const target =
    script ??
    (document.querySelector('script[data-project][src*="zivodoc"]') as HTMLScriptElement | null);
  if (!target) return;
  try {
    const cfg = readConfig(target);
    const start = (): ChatWidget => new ChatWidget(cfg);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => start(), { once: true });
    } else {
      start();
    }
  } catch (err) {
    console.error('[zivodoc-chat] failed to mount:', err);
  }
}

autoMount();

export { ChatWidget };
