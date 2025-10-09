// テーマ管理システム
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggle = null;
        this.themeIcon = null;
        this.init();
    }

    init() {
        // DOM要素を取得
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        
        if (!this.themeToggle || !this.themeIcon) {
            console.warn('Theme toggle elements not found');
            return;
        }

        // 保存されたテーマを読み込み
        this.loadSavedTheme();
        
        // イベントリスナーを設定
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // システムテーマの変更を監視
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (!localStorage.getItem('theme')) {
                    this.setSystemTheme();
                }
            });
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
        } else {
            // システムテーマを使用
            this.setSystemTheme();
        }
    }

    setSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
            this.applyTheme('dark');
        } else {
            this.currentTheme = 'light';
            this.applyTheme('light');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.currentTheme = newTheme;
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
    }

    applyTheme(theme) {
        // body要素にdata-theme属性を設定
        document.body.setAttribute('data-theme', theme);
        
        // アイコンを更新
        this.updateIcon(theme);
        
        // テーマ切り替えアニメーション
        this.animateThemeChange();
    }

    updateIcon(theme) {
        if (!this.themeIcon) return;
        
        if (theme === 'dark') {
            this.themeIcon.className = 'fas fa-moon';
            this.themeToggle.title = 'ライトテーマに切り替える';
        } else {
            this.themeIcon.className = 'fas fa-sun';
            this.themeToggle.title = 'ダークテーマに切り替える';
        }
    }

    animateThemeChange() {
        // テーマ切り替え時のアニメーション効果
        document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
        
        // アニメーション完了後にtransitionを削除
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// テーママネージャーのインスタンスを作成
let themeManager;

// DOM読み込み完了後にテーママネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});

// グローバルからアクセス可能にする
window.themeManager = themeManager;