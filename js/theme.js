// theme.js — パステル/ライト/ダーク/モノクロテーマの管理
//
// data-theme 属性を <html> に設定。保存が無ければデフォルトのパステルを使用する。

const STORAGE_KEY = 'theme';
const THEMES = ['pastel', 'light', 'dark', 'mono'];
const DEFAULT_THEME = 'pastel';

const META_COLORS = {
    pastel: '#eeecf4',
    light: '#ffffff',
    dark: '#0f172a',
    mono: '#0e0e0e',
};

export class ThemeManager {
    constructor() {
        this.current = this.resolveInitial();
        this.apply(this.current);
    }

    resolveInitial() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (THEMES.includes(saved)) return saved;
        return DEFAULT_THEME;
    }

    apply(theme) {
        this.current = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', META_COLORS[theme] || META_COLORS[DEFAULT_THEME]);
    }

    toggle() {
        const idx = THEMES.indexOf(this.current);
        const next = THEMES[(idx + 1) % THEMES.length];
        this.apply(next);
        localStorage.setItem(STORAGE_KEY, next);
        return next;
    }

    getTheme() { return this.current; }
}
