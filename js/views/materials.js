// views/materials.js — 材料計算結果 + 在庫（have/need）を1画面に統合
//
// 数量からレシピを基本材料まで展開し、各材料について
//   ・必要量（needed）
//   ・手持ち在庫（have, 入力可・永続化）
//   ・充足状態（sufficient/insufficient）
//   ・チェックオフ（収集済みマーク）
// を表示する。在庫入力は silent 更新 + デバウンス保存で再描画を起こさない。

import { el, icon, clear } from '../dom.js';
import { saveToLocalStorage } from '../persistence.js';

let saveTimer = null;
function scheduleSave(store) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveToLocalStorage(store), 400);
}

/**
 * @param {import('../store.js').Store} store
 * @param {string} recipeName
 * @param {number} quantity
 * @returns {HTMLElement}
 */
export function renderMaterials(store, recipeName, quantity) {
    const recipe = store.getRecipe(recipeName);
    if (!recipe) return el('p', { class: 'result-empty' }, 'レシピが見つかりません');

    const expanded = store.expand(recipeName, quantity);
    const entries = Object.entries(expanded).sort(([a], [b]) => a.localeCompare(b, 'ja'));

    if (entries.length === 0) {
        return el('p', { class: 'result-empty' }, '必要な材料がありません');
    }

    const grid = el('div', { class: 'materials-grid' });
    const cards = [];
    const summaryCount = el('span', { class: 'summary-count' });
    const summaryFill = el('div', { class: 'summary-fill' });
    const summaryBar = el('div', { class: 'summary-bar' }, [summaryFill]);

    const updateSummary = () => {
        const total = cards.length;
        const done = cards.filter(c => c.isSufficient()).length;
        summaryCount.textContent = `${done} / ${total} 材料が充足`;
        summaryFill.style.width = total ? `${(done / total) * 100}%` : '0%';
    };

    entries.forEach(([name, needed]) => {
        const card = buildCard(store, name, needed, updateSummary);
        cards.push(card);
        grid.appendChild(card.element);
    });

    const header = el('div', { class: 'result-header' }, [
        el('div', { class: 'result-title' }, [
            el('h4', {}, `${recipe.name} ×${quantity}`),
            el('p', {}, `基本材料 ${entries.length} 種`),
        ]),
        el('div', { class: 'result-controls' }, [
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => cards.forEach(c => c.setChecked(true)) }, [icon('fa-check-double'), ' 全チェック']),
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => cards.forEach(c => c.setChecked(false)) }, [icon('fa-eraser'), ' 全解除']),
        ]),
    ]);

    const summary = el('div', { class: 'result-summary' }, [summaryCount, summaryBar]);

    updateSummary();
    return el('div', { class: 'materials-result' }, [header, summary, grid]);
}

function buildCard(store, name, needed, onChange) {
    const data = store.getRecipe(name);
    const iconClass = data ? data.icon : 'fa-cube';
    let have = store.getInventory(name);

    const statusDot = el('span', { class: 'card-status' });
    const neededEl = el('span', { class: 'need-value' }, String(needed));

    const haveInput = el('input', {
        type: 'number', min: '0', class: 'have-input', value: String(have),
        'aria-label': `${name} の在庫`,
    });

    const checkbox = el('input', { type: 'checkbox', class: 'card-check', 'aria-label': `${name} を収集済みにする` });

    const element = el('div', { class: 'material-card' }, [
        el('label', { class: 'card-checkwrap' }, [checkbox, el('span', { class: 'card-checkbox' })]),
        el('div', { class: 'card-icon' }, [icon(iconClass)]),
        el('div', { class: 'card-body' }, [
            el('div', { class: 'card-name', title: name }, name),
            el('div', { class: 'card-amounts' }, [
                el('span', { class: 'amount need' }, [icon('fa-bullseye'), ' 必要 ', neededEl]),
                el('span', { class: 'amount have' }, [icon('fa-box-open'), ' 在庫 ', haveInput]),
            ]),
        ]),
        statusDot,
    ]);

    const isSufficient = () => have >= needed;

    const refresh = () => {
        const ok = isSufficient();
        element.classList.toggle('sufficient', ok);
        element.classList.toggle('insufficient', !ok);
        statusDot.className = `card-status ${ok ? 'ok' : 'no'}`;
        statusDot.replaceChildren(icon(ok ? 'fa-check' : 'fa-xmark'));
        onChange();
    };

    haveInput.addEventListener('input', () => {
        have = Math.max(0, Math.floor(Number(haveInput.value) || 0));
        store.setInventory(name, have, { silent: true });
        scheduleSave(store);
        refresh();
    });

    checkbox.addEventListener('change', () => {
        element.classList.toggle('checked', checkbox.checked);
    });

    refresh();

    return {
        element,
        isSufficient,
        setChecked(v) { checkbox.checked = v; element.classList.toggle('checked', v); },
    };
}
