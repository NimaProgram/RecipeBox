// views/welcome.js — データが空のときのウェルカム画面

import { el, icon } from '../dom.js';

const FEATURES = [
    ['fa-calculator', '自動材料計算', '必要な基本材料を瞬時に算出'],
    ['fa-sitemap', '階層レシピ', '複雑な依存関係も折りたたみツリーで管理'],
    ['fa-gamepad', 'ゲーム対応', '黒い砂漠などのアイテム制作にも最適'],
    ['fa-box-open', '在庫管理', '手持ちと必要量を並べて過不足を把握'],
    ['fa-download', 'データ保存', 'JSON で簡単にバックアップ・復元'],
];

/**
 * @param {{onCreate:Function, onImport:Function}} handlers
 * @returns {HTMLElement}
 */
export function renderWelcome({ onCreate, onImport }) {
    return el('section', { class: 'welcome' }, [
        el('div', { class: 'welcome-badge' }, [icon('fa-utensils')]),
        el('h2', { class: 'welcome-title' }, 'RecipeBox へようこそ'),
        el('p', { class: 'welcome-lead' },
            '複雑なレシピと材料の依存関係を、すっきり管理。最初のレシピを作成するか、データを読み込んで始めましょう。'),
        el('div', { class: 'welcome-features' },
            FEATURES.map(([ic, title, desc]) => el('div', { class: 'feature-card' }, [
                el('div', { class: 'feature-icon' }, [icon(ic)]),
                el('div', {}, [
                    el('h3', { class: 'feature-title' }, title),
                    el('p', { class: 'feature-desc' }, desc),
                ]),
            ]))),
        el('div', { class: 'welcome-actions' }, [
            el('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: onCreate }, [icon('fa-plus'), ' 最初のレシピを作成']),
            el('button', { type: 'button', class: 'btn btn-ghost btn-lg', onclick: onImport }, [icon('fa-upload'), ' データを読み込む']),
        ]),
    ]);
}
