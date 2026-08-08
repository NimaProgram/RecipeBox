// theme.js — ライト/ダークテーマの管理
//
// data-theme 属性を <html> に設定。保存が無ければ OS 設定に追従する。

const STORAGE_KEY = 'theme';

export class ThemeManager {
    constructor() {
        this.current = this.resolveInitial();
        this.apply(this.current);
        this.watchSystem();
    }

    resolveInitial() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return this.systemPrefersDark() ? 'dark' : 'light';
    }

    systemPrefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    apply(theme) {
        this.current = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }

    toggle() {
        const next = this.current === 'light' ? 'dark' : 'light';
        this.apply(next);
        localStorage.setItem(STORAGE_KEY, next);
        return next;
    }

    watchSystem() {
        if (!window.matchMedia) return;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) this.apply(e.matches ? 'dark' : 'light');
        });
    }

    getTheme() { return this.current; }
}
