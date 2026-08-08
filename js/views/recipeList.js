// views/recipeList.js — レシピ一覧モーダル（検索・種別フィルタ・編集/選択/削除）

import { el, icon, clear } from '../dom.js';
import { openModal, confirmDialog, notify } from '../dialogs.js';
import { createCombobox } from '../combobox.js';
import { openRecipeForm } from './recipeForm.js';

/**
 * @param {import('../store.js').Store} store
 * @param {{onSelect?:(name:string)=>void}} [opts]
 */
export function openRecipeList(store, { onSelect } = {}) {
    const searchInput = el('input', { type: 'search', class: 'form-input', placeholder: 'レシピを検索...' });
    const filterBox = createCombobox({
        options: [
            { value: 'all', label: 'すべて' },
            { value: 'recipe', label: 'レシピ' },
            { value: 'basic', label: '基本材料' },
        ],
        value: 'all',
        onSelect: () => render(),
    });

    const content = el('div', { class: 'recipe-list' });

    function render() {
        const term = searchInput.value.trim().toLowerCase();
        const type = filterBox.getValue() || 'all';
        let recipes = store.getAllRecipes();
        if (term) recipes = recipes.filter(r => r.name.toLowerCase().includes(term));
        if (type !== 'all') recipes = recipes.filter(r => r.type === type);
        recipes.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

        clear(content);
        content.appendChild(el('div', { class: 'list-count' }, `${recipes.length} 件`));

        if (recipes.length === 0) {
            content.appendChild(el('p', { class: 'result-empty' }, '該当するレシピがありません'));
            return;
        }

        const grid = el('div', { class: 'recipe-grid' });
        recipes.forEach(recipe => grid.appendChild(buildCard(recipe)));
        content.appendChild(grid);
    }

    function buildCard(recipe) {
        const isRecipe = recipe.type === 'recipe';
        const ingCount = recipe.ingredients ? Object.keys(recipe.ingredients).length : 0;

        const actions = el('div', { class: 'recipe-card-actions' }, [
            isRecipe && onSelect
                ? el('button', { type: 'button', class: 'icon-btn', title: '計算対象に選択', onclick: () => { onSelect(recipe.name); modal.close(); } }, [icon('fa-arrow-right-to-bracket')])
                : null,
            el('button', { type: 'button', class: 'icon-btn', title: '編集', onclick: () => openRecipeForm(store, recipe.name) }, [icon('fa-pen')]),
            el('button', { type: 'button', class: 'icon-btn danger', title: '削除', onclick: () => remove(recipe.name) }, [icon('fa-trash')]),
        ].filter(Boolean));

        return el('div', { class: 'recipe-card' }, [
            el('div', { class: 'recipe-card-icon' }, [icon(recipe.icon || 'fa-utensils')]),
            el('div', { class: 'recipe-card-body' }, [
                el('div', { class: 'recipe-card-head' }, [
                    el('h4', { class: 'recipe-card-name', title: recipe.name }, recipe.name),
                    el('span', { class: `tree-badge ${isRecipe ? 'recipe' : 'basic'}` }, isRecipe ? 'レシピ' : '基本材料'),
                ]),
                recipe.description ? el('p', { class: 'recipe-card-desc' }, recipe.description) : null,
                ingCount ? el('span', { class: 'recipe-card-meta' }, `材料 ${ingCount} 種`) : null,
            ].filter(Boolean)),
            actions,
        ]);
    }

    async function remove(name) {
        const dependents = store.dependents(name);
        const detail = dependents.length
            ? el('div', {}, [
                el('p', {}, '次のレシピがこの材料を使用しています:'),
                el('ul', { class: 'dependents-list' }, dependents.map(d => el('li', {}, d))),
            ])
            : null;
        const ok = await confirmDialog({
            title: 'レシピを削除',
            message: `「${name}」を削除しますか？`,
            detail,
            confirmLabel: '削除',
            danger: true,
        });
        if (!ok) return;
        store.deleteNode(name);
        notify(`「${name}」を削除しました`, 'success');
    }

    searchInput.addEventListener('input', render);

    const body = el('div', {}, [
        el('div', { class: 'list-filters' }, [
            el('div', { class: 'search-field' }, [icon('fa-magnifying-glass', 'search-icon'), searchInput]),
            filterBox.element,
        ]),
        content,
    ]);

    const unsubscribe = store.subscribe(render);
    render();

    const modal = openModal({
        title: 'レシピ一覧',
        size: 'wide',
        body,
        onClose: () => unsubscribe(),
    });
}
