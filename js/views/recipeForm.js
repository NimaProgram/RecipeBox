// views/recipeForm.js — レシピ追加/編集モーダル
//
// ・名前 / 基本作成数 / アイコン / 説明 / 材料（複数行）を編集
// ・材料行はコンボボックス（検索 + 新規材料追加）
// ・編集で名前が変わった場合は store.renameNode（改名カスケード）で安全に反映
// ・自己参照/循環参照はチェックして拒否

import { el, icon } from '../dom.js';
import { openModal, notify, promptDialog } from '../dialogs.js';
import { createCombobox } from '../combobox.js';
import { DEFAULT_ICON } from '../icons.js';
import { categoryOptions, openCategoryEditor } from './categories.js';

/** カテゴリ選択コンボボックス（検索 + インラインでカテゴリ追加） */
function createCategoryBox(store, value) {
    const box = createCombobox({
        options: categoryOptions(store),
        value: value || DEFAULT_ICON,
        placeholder: 'カテゴリを選択...',
        searchable: true,
        allowAdd: true,
        addLabel: 'カテゴリを追加',
        onAdd: async () => {
            const created = await openCategoryEditor(store);
            if (created) { box.setOptions(categoryOptions(store)); box.setValue(created); }
        },
    });
    return box;
}

function ingredientOptions(store, excludeName) {
    return store.getAllRecipes()
        .filter(r => r.name !== excludeName)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
        .map(r => ({
            value: r.name,
            label: `${r.name}（${r.type === 'basic' ? '基本材料' : 'レシピ'}）`,
            icon: r.icon || DEFAULT_ICON,
        }));
}

/**
 * 新しい基本材料を作成する小モーダル。
 * @returns {Promise<string|null>} 作成した材料名、キャンセル時 null
 */
function openIngredientCreator(store) {
    return new Promise((resolve) => {
        let resolved = false;
        const settle = (v) => { if (!resolved) { resolved = true; resolve(v); } };

        const nameInput = el('input', { type: 'text', class: 'form-input', placeholder: '例: トマト, 小麦粉, 砂糖', 'data-autofocus': 'true' });
        const errorEl = el('small', { class: 'form-error', role: 'alert' });
        const iconBox = createCategoryBox(store, DEFAULT_ICON);

        const accept = () => {
            const name = nameInput.value.trim();
            if (!name) { errorEl.textContent = '材料名を入力してください'; return false; }
            if (store.hasRecipe(name)) { errorEl.textContent = `「${name}」は既に存在します`; return false; }
            store.upsertRecipe({ name, icon: iconBox.getValue() || DEFAULT_ICON });
            settle(name);
            return true;
        };

        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (accept()) modal.close(); }
        });

        const body = el('div', {}, [
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, '材料名'), nameInput, errorEl]),
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'アイコン'), iconBox.element]),
        ]);

        const modal = openModal({
            title: '新しい材料を追加',
            size: 'narrow',
            body,
            onClose: () => settle(null),
            actions: [
                { label: 'キャンセル', variant: 'ghost' },
                { label: '追加', variant: 'primary', onClick: () => accept() === false },
            ],
        });
    });
}

/**
 * レシピ追加/編集モーダルを開く。
 * @param {import('../store.js').Store} store
 * @param {string|null} editName 編集対象名（新規は null）
 */
export function openRecipeForm(store, editName = null) {
    const editing = editName ? store.getRecipe(editName) : null;
    const rows = [];

    const nameInput = el('input', { type: 'text', class: 'form-input', required: true, value: editing ? editing.name : '', placeholder: 'レシピ / 材料名' });
    const baseQtyInput = el('input', { type: 'number', min: '1', class: 'form-input', value: editing ? String(editing.baseQuantity || 1) : '1' });
    const iconBox = createCategoryBox(store, editing ? editing.icon : DEFAULT_ICON);
    const descInput = el('textarea', { class: 'form-input form-textarea', rows: '2', placeholder: '任意のメモ' });
    if (editing) descInput.value = editing.description || '';

    const ingredientsList = el('div', { class: 'ingredients-list' });

    function refreshAllOptions() {
        const opts = ingredientOptions(store, nameInput.value.trim());
        rows.forEach(r => {
            const cur = r.box.getValue();
            r.box.setOptions(opts);
            if (cur) r.box.setValue(cur);
        });
    }

    function addRow(selected = '', qty = 1) {
        const box = createCombobox({
            options: ingredientOptions(store, nameInput.value.trim()),
            value: selected,
            placeholder: '材料を選択...',
            searchable: true,
            allowAdd: true,
            addLabel: '新しい材料を追加',
            onAdd: async () => {
                const created = await openIngredientCreator(store);
                if (created) {
                    refreshAllOptions();
                    box.setValue(created);
                }
            },
        });
        const qtyInput = el('input', { type: 'number', min: '1', class: 'form-input qty-input', value: String(qty), 'aria-label': '数量' });
        const removeBtn = el('button', { type: 'button', class: 'icon-btn remove-row', 'aria-label': '材料を削除' }, [icon('fa-xmark')]);

        const row = el('div', { class: 'ingredient-row' }, [box.element, qtyInput, removeBtn]);
        removeBtn.addEventListener('click', () => {
            const idx = rows.findIndex(r => r.row === row);
            if (idx >= 0) rows.splice(idx, 1);
            row.remove();
        });

        rows.push({ row, box, qtyInput });
        ingredientsList.appendChild(row);
    }

    // 初期材料行
    if (editing && editing.ingredients && Object.keys(editing.ingredients).length) {
        for (const [ing, qty] of Object.entries(editing.ingredients)) addRow(ing, qty);
    } else {
        addRow();
    }

    // 名前変更で自己参照候補が変わるためオプション更新
    nameInput.addEventListener('change', refreshAllOptions);

    const body = el('div', {}, [
        el('div', { class: 'form-grid' }, [
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'レシピ名'), nameInput]),
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, '基本作成数'), baseQtyInput]),
        ]),
        el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'アイコン'), iconBox.element]),
        el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, '説明（任意）'), descInput]),
        el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '材料'),
            el('p', { class: 'form-hint' }, '材料を追加しなければ「基本材料」として登録されます'),
            ingredientsList,
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm add-ingredient', onclick: () => addRow() }, [icon('fa-plus'), ' 材料を追加']),
        ]),
    ]);

    function save() {
        const name = nameInput.value.trim();
        if (!name) { notify('レシピ名を入力してください', 'error'); return false; }

        // 名前変更で衝突しないか
        if (editing && name !== editing.name && store.hasRecipe(name)) {
            notify(`「${name}」は既に存在します`, 'error'); return false;
        }
        if (!editing && store.hasRecipe(name)) {
            notify(`「${name}」は既に存在します`, 'error'); return false;
        }

        // 材料収集
        const ingredients = {};
        for (const r of rows) {
            const ing = r.box.getValue();
            const qty = Math.max(1, Math.floor(Number(r.qtyInput.value) || 0));
            if (!ing) continue;
            if (ing === name) { notify('レシピが自分自身を材料にはできません', 'error'); return false; }
            if (store.wouldCycle(name, ing)) { notify(`「${ing}」を材料にすると循環参照になります`, 'error'); return false; }
            ingredients[ing] = (ingredients[ing] || 0) + qty;
        }

        // 編集で改名がある場合は先にカスケード改名
        if (editing && name !== editing.name) {
            try { store.renameNode(editing.name, name); }
            catch (err) { notify(err.message, 'error'); return false; }
        }

        store.upsertRecipe({
            name,
            baseQuantity: Math.max(1, Math.floor(Number(baseQtyInput.value) || 1)),
            ingredients,
            icon: iconBox.getValue() || DEFAULT_ICON,
            description: descInput.value.trim(),
        });

        notify(`「${name}」を保存しました`, 'success');
        return true;
    }

    openModal({
        title: editing ? 'レシピを編集' : 'レシピを追加',
        body,
        actions: [
            { label: 'キャンセル', variant: 'ghost' },
            { label: '保存', variant: 'primary', onClick: () => save() === false },
        ],
    });

    setTimeout(() => nameInput.focus(), 0);
}
