// views/tree.js — レシピ構成の依存ツリー（折りたたみ可能・再帰）

import { el, icon } from '../dom.js';

/**
 * レシピの依存ツリー要素を構築する。
 * @param {import('../store.js').Store} store
 * @param {string} recipeName
 * @returns {HTMLElement}
 */
export function buildTree(store, recipeName) {
    const root = el('div', { class: 'tree' });
    root.appendChild(buildNode(store, recipeName, 0, new Set(), null));
    return root;
}

function buildNode(store, name, depth, visited, amount) {
    if (visited.has(name)) {
        return errorNode(name, '循環参照', 'fa-triangle-exclamation', amount);
    }
    const recipe = store.getRecipe(name);
    if (!recipe) {
        return errorNode(name, '未登録', 'fa-circle-question', amount);
    }

    visited.add(name);
    const isRecipe = recipe.type === 'recipe' && recipe.ingredients && Object.keys(recipe.ingredients).length > 0;

    const node = el('div', { class: `tree-node ${isRecipe ? 'is-recipe' : 'is-basic'}`, dataset: { depth } });

    const toggle = isRecipe
        ? el('button', { type: 'button', class: 'tree-toggle', 'aria-label': '折りたたみ' }, [icon('fa-chevron-down')])
        : el('span', { class: 'tree-bullet' });

    const label = el('div', { class: 'tree-label' }, [
        icon(recipe.icon || 'fa-utensils', 'tree-icon'),
        el('span', { class: 'tree-name' }, recipe.name),
        el('span', { class: `tree-badge ${isRecipe ? 'recipe' : 'basic'}` }, isRecipe ? 'レシピ' : '基本材料'),
    ]);

    const row = el('div', { class: 'tree-row' }, [toggle, label]);
    if (amount != null && depth > 0) {
        row.appendChild(el('span', { class: 'tree-amount' }, [el('span', { class: 'amount-badge' }, `×${amount}`)]));
    }
    node.appendChild(row);

    if (isRecipe) {
        const children = el('div', { class: 'tree-children' });
        for (const [ing, qty] of Object.entries(recipe.ingredients)) {
            children.appendChild(buildNode(store, ing, depth + 1, new Set(visited), qty));
        }
        node.appendChild(children);

        toggle.addEventListener('click', () => {
            const collapsed = node.classList.toggle('collapsed');
            toggle.setAttribute('aria-label', collapsed ? '展開' : '折りたたみ');
        });
    }

    visited.delete(name);
    return node;
}

function errorNode(name, msg, iconClass, amount) {
    const row = el('div', { class: 'tree-row' }, [
        el('span', { class: 'tree-bullet' }),
        el('div', { class: 'tree-label' }, [
            icon(iconClass, 'tree-icon error'),
            el('span', { class: 'tree-name' }, name),
            el('span', { class: 'tree-badge error' }, msg),
        ]),
        amount != null ? el('span', { class: 'tree-amount' }, [el('span', { class: 'amount-badge' }, `×${amount}`)]) : null,
    ].filter(Boolean));
    return el('div', { class: 'tree-node is-error' }, [row]);
}

/** ツリー全体を展開/折りたたみ */
export function setTreeCollapsed(treeEl, collapsed) {
    treeEl.querySelectorAll('.tree-node.is-recipe').forEach(node => {
        node.classList.toggle('collapsed', collapsed);
        const toggle = node.querySelector(':scope > .tree-row > .tree-toggle');
        if (toggle) toggle.setAttribute('aria-label', collapsed ? '展開' : '折りたたみ');
    });
}
