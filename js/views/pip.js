// views/pip.js — レシピ（構成 / 材料計算）の PiP。汎用ホスト pip-host を使う。

import { el, icon, clear } from '../dom.js';
import { openPipWindow, isPipSupported } from './pip-host.js';
import { buildTree, setTreeCollapsed } from './tree.js';
import { renderMaterials } from './materials.js';

export { isPipSupported };

function firstSelectable(store) {
    const r = store.getRecipesWithIngredients();
    return r.length ? r[0].name : '';
}

function pipToggleBtn(ic, label, active, onClick) {
    return el('button', {
        type: 'button', class: 'pip-toggle-btn' + (active ? ' active' : ''), onclick: onClick,
    }, [icon(ic), ' ', label]);
}

/**
 * レシピの PiP を開く（構成 or 計算）。
 * @param {import('../store.js').Store} store
 * @param {{mode?:'tree'|'materials', selected?:string, quantity?:number}} opts
 */
export function openPip(store, { mode = 'tree', selected = '', quantity = 1 } = {}) {
    return openPipWindow({
        title: 'MMO Toolkit — レシピ',
        mount: (win, container) => {
            const state = {
                mode,
                selected: selected || firstSelectable(store),
                quantity: Math.max(1, Math.floor(quantity || 1)),
            };

            const controlsEl = el('div', { class: 'pip-controls' });
            const contentEl = el('div', { class: 'pip-content' });
            container.append(controlsEl, contentEl);

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
                    const qty = el('input', { type: 'number', min: '1', class: 'pip-qty', value: String(state.quantity), 'aria-label': '個数' });
                    qty.addEventListener('input', () => { state.quantity = Math.max(1, Math.floor(Number(qty.value) || 1)); renderContent(); });
                    rows.push(el('div', { class: 'pip-field pip-qty-field' }, [el('span', { class: 'pip-qty-label' }, '作る個数 ×'), qty]));
                }
                controlsEl.append(...rows);
            }

            function renderContent() {
                clear(contentEl);
                if (!state.selected) { contentEl.appendChild(el('p', { class: 'result-empty' }, 'レシピを選択してください')); return; }
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

            function switchMode(m) { if (state.mode !== m) { state.mode = m; renderControls(); renderContent(); } }

            const unsubscribe = store.subscribe(() => { renderControls(); renderContent(); });
            renderControls();
            renderContent();
            return { dispose: unsubscribe };
        },
    });
}
