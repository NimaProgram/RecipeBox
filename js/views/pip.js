// views/pip.js — Document Picture-in-Picture（レシピ構成 / 材料計算）
//
// フルスクリーンのゲーム上に常時最前面で表示できる唯一の手段が
// Document Picture-in-Picture API（Chromium 116+）。同時に開けるのは1つ。
//
// 注意: PiP ドキュメント内の要素は opener の JS から操作する。combobox のような
// document/window レベルのリスナー（＝opener を参照）を使う部品は避け、
// ここではネイティブ <select> / <input> と、要素レベルのみで動く
// buildTree / renderMaterials を再利用する。

import { el, icon, clear } from '../dom.js';
import { notify } from '../dialogs.js';
import { buildTree, setTreeCollapsed } from './tree.js';
import { renderMaterials } from './materials.js';

let current = null; // { win, state, renderControls, renderContent }

export function isPipSupported() {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

/**
 * PiP を開く（未対応時はトースト）。既に開いていればモード等を切り替える。
 * ※ requestWindow はユーザー操作直下（クリックハンドラ内）で呼ぶこと。
 * @param {import('../store.js').Store} store
 * @param {{mode?:'tree'|'materials', selected?:string, quantity?:number}} opts
 */
export async function openPip(store, { mode = 'tree', selected = '', quantity = 1 } = {}) {
    if (!isPipSupported()) {
        notify('お使いのブラウザは PiP に対応していません（Chrome / Edge をご利用ください）', 'warning');
        return;
    }

    // 既に開いている場合はモード/選択/個数を更新して再描画＋フォーカス（1ウィンドウ制約）
    if (current && current.win && !current.win.closed) {
        current.state.mode = mode;
        if (selected) current.state.selected = selected;
        if (quantity) current.state.quantity = Math.max(1, Math.floor(quantity));
        current.renderControls();
        current.renderContent();
        try { current.win.focus(); } catch { /* noop */ }
        return;
    }

    let win;
    try {
        win = await documentPictureInPicture.requestWindow({ width: 380, height: 560 });
    } catch (err) {
        notify(`PiP を開けませんでした: ${err.message}`, 'error');
        return;
    }

    copyStyles(win);
    win.document.documentElement.lang = 'ja';
    win.document.title = 'RecipeBox — PiP';
    win.document.body.classList.add('pip');

    const state = {
        mode,
        selected: selected || firstSelectable(store),
        quantity: Math.max(1, Math.floor(quantity || 1)),
    };

    const controlsEl = win.document.createElement('div');
    controlsEl.className = 'pip-controls';
    const contentEl = win.document.createElement('div');
    contentEl.className = 'pip-content';
    const root = win.document.createElement('div');
    root.className = 'pip-root';
    root.append(controlsEl, contentEl);
    win.document.body.appendChild(root);

    function renderControls() {
        clear(controlsEl);
        const recipes = store.getRecipesWithIngredients();

        const toggle = el('div', { class: 'pip-toggle' }, [
            pipToggleBtn('fa-sitemap', '構成', state.mode === 'tree', () => switchMode('tree')),
            pipToggleBtn('fa-calculator', '計算', state.mode === 'materials', () => switchMode('materials')),
        ]);

        const select = el('select', { class: 'pip-select', 'aria-label': 'レシピ' });
        if (recipes.length === 0) {
            select.appendChild(el('option', { value: '' }, 'レシピがありません'));
            select.disabled = true;
        } else {
            if (!recipes.some(r => r.name === state.selected)) state.selected = recipes[0].name;
            recipes.forEach(r => {
                const opt = el('option', { value: r.name }, r.name);
                if (r.name === state.selected) opt.selected = true;
                select.appendChild(opt);
            });
        }
        select.addEventListener('change', () => { state.selected = select.value; renderContent(); });

        const rows = [toggle, el('div', { class: 'pip-field' }, [select])];

        if (state.mode === 'materials') {
            const qty = el('input', {
                type: 'number', min: '1', class: 'pip-qty', value: String(state.quantity), 'aria-label': '個数',
            });
            qty.addEventListener('input', () => {
                state.quantity = Math.max(1, Math.floor(Number(qty.value) || 1));
                renderContent();
            });
            rows.push(el('div', { class: 'pip-field pip-qty-field' }, [el('span', { class: 'pip-qty-label' }, '作る個数 ×'), qty]));
        }

        controlsEl.append(...rows);
    }

    function renderContent() {
        clear(contentEl);
        if (!state.selected) {
            contentEl.appendChild(el('p', { class: 'result-empty' }, 'レシピを選択してください'));
            return;
        }
        if (state.mode === 'tree') {
            const treeEl = buildTree(store, state.selected);
            const treeControls = el('div', { class: 'tree-controls' }, [
                el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setTreeCollapsed(treeEl, false) }, [icon('fa-angles-down'), ' 全展開']),
                el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setTreeCollapsed(treeEl, true) }, [icon('fa-angles-up'), ' 全折りたたみ']),
            ]);
            contentEl.append(treeControls, treeEl);
        } else {
            contentEl.appendChild(renderMaterials(store, state.selected, state.quantity));
        }
    }

    function switchMode(m) {
        if (state.mode === m) return;
        state.mode = m;
        renderControls();
        renderContent();
    }

    // 構造変化（レシピ編集など）に追従。在庫入力は silent 更新のため発火しない。
    const unsubscribe = store.subscribe(() => { renderControls(); renderContent(); });
    win.addEventListener('pagehide', () => {
        unsubscribe();
        if (current && current.win === win) current = null;
    });

    current = { win, state, renderControls, renderContent };
    renderControls();
    renderContent();
}

function firstSelectable(store) {
    const r = store.getRecipesWithIngredients();
    return r.length ? r[0].name : '';
}

function pipToggleBtn(ic, label, active, onClick) {
    return el('button', {
        type: 'button', class: 'pip-toggle-btn' + (active ? ' active' : ''), onclick: onClick,
    }, [icon(ic), ' ', label]);
}

/** 同一オリジンの stylesheet を絶対URLで複製し、テーマを同期する（第三者・インライン無し） */
function copyStyles(win) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const l = win.document.createElement('link');
        l.rel = 'stylesheet';
        l.href = link.href; // 絶対URL（PiP の base 差異を回避）
        win.document.head.appendChild(l);
    });
    // CSP を可能な範囲で継承（多層防御。動的 meta は無視される場合あり）
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) win.document.head.appendChild(csp.cloneNode(true));
    win.document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
}
