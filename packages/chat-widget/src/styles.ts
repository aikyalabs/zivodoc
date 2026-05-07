export const STYLES = `
.zd-root { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif; color: var(--zd-fg, #0a0a0a); }
.zd-root *, .zd-root *::before, .zd-root *::after { box-sizing: border-box; }
.zd-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px; background: var(--zd-accent, #0a0a0a); color: #fff; border: none; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.18); display: flex; align-items: center; justify-content: center; z-index: 2147483646; transition: transform .2s; }
.zd-fab:hover { transform: scale(1.05); }
.zd-fab svg { width: 24px; height: 24px; }
.zd-panel { position: fixed; bottom: 96px; right: 24px; width: 380px; height: min(560px, calc(100vh - 120px)); background: var(--zd-bg, #fff); border: 1px solid var(--zd-border, #e5e5e5); border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,.16); display: flex; flex-direction: column; overflow: hidden; z-index: 2147483647; }
.zd-header { padding: 14px 16px; border-bottom: 1px solid var(--zd-border, #e5e5e5); display: flex; align-items: center; justify-content: space-between; }
.zd-title { font-size: 14px; font-weight: 600; }
.zd-close { background: none; border: none; cursor: pointer; padding: 4px; color: var(--zd-muted, #737373); }
.zd-close svg { width: 16px; height: 16px; display: block; }
.zd-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; font-size: 14px; line-height: 1.5; }
.zd-msg { padding: 10px 12px; border-radius: 10px; max-width: 85%; word-wrap: break-word; white-space: pre-wrap; }
.zd-msg-user { background: var(--zd-accent, #0a0a0a); color: #fff; align-self: flex-end; }
.zd-msg-assistant { background: var(--zd-msg-bg, #f5f5f5); color: var(--zd-fg, #0a0a0a); align-self: flex-start; }
.zd-citations { font-size: 12px; color: var(--zd-muted, #737373); margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.zd-cite { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; background: var(--zd-msg-bg, #f5f5f5); border: 1px solid var(--zd-border, #e5e5e5); text-decoration: none; color: var(--zd-fg, #0a0a0a); font-size: 11px; }
.zd-cite:hover { background: var(--zd-border, #e5e5e5); }
.zd-empty { color: var(--zd-muted, #737373); font-size: 13px; text-align: center; padding: 32px 16px; }
.zd-form { padding: 12px; border-top: 1px solid var(--zd-border, #e5e5e5); display: flex; gap: 8px; }
.zd-input { flex: 1; padding: 8px 12px; border: 1px solid var(--zd-border, #e5e5e5); border-radius: 8px; font-size: 14px; outline: none; background: var(--zd-bg, #fff); color: var(--zd-fg, #0a0a0a); font-family: inherit; }
.zd-input:focus { border-color: var(--zd-accent, #0a0a0a); }
.zd-send { padding: 8px 14px; background: var(--zd-accent, #0a0a0a); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
.zd-send:disabled { opacity: .5; cursor: not-allowed; }
.zd-footer { padding: 6px 12px; font-size: 11px; color: var(--zd-muted, #737373); text-align: center; border-top: 1px solid var(--zd-border, #e5e5e5); }
.zd-footer a { color: inherit; text-decoration: none; }
.zd-footer a:hover { text-decoration: underline; }
.zd-cursor { display: inline-block; width: 7px; height: 14px; background: currentColor; vertical-align: text-bottom; animation: zd-blink 1s steps(2) infinite; margin-left: 1px; }
@keyframes zd-blink { 50% { opacity: 0; } }
@media (max-width: 500px) {
  .zd-panel { right: 12px; left: 12px; width: auto; bottom: 84px; }
  .zd-fab { right: 16px; bottom: 16px; }
}
`;
