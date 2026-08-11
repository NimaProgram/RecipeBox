// views/categories.js — アイコン=カテゴリの管理（追加・編集・削除）とグリフピッカー

import { el, icon, clear } from '../dom.js';
import { openModal, confirmDialog, notify } from '../dialogs.js';
import { ICON_PALETTE, DEFAULT_ICON, normalizeIconClass } from '../icons.js';

/** カテゴリ → コンボボックス選択肢 */
export function categoryOptions(store) {
    return store.getCategories().map(c => ({ value: c.icon, label: c.label, icon: c.icon }));
}

/**
 * グリフピッカー（パレット + fa-* 直接入力 + ライブプレビュー）。
 * @returns {{element:HTMLElement, getValue:()=>string, setValue:(v:string)=>void}}
 */
export function createIconPicker({ value = DEFAULT_ICON } = {}) {
    let current = normalizeIconClass(value) || DEFAULT_ICON;

    const previewGlyph = el('span', { class: 'icon-preview-glyph' });
    const previewCode = el('code', { class: 'icon-preview-code' });
    const preview = el('div', { class: 'icon-preview' }, [previewGlyph, previewCode]);

    const input = el('input', {
        type: 'text', class: 'form-input', value: current,
        placeholder: '例: fa-egg', 'aria-label': 'アイコンクラス',
    });

    const grid = el('div', { class: 'icon-palette' });
    ICON_PALETTE.forEach(glyph => {
        const cell = el('button', {
            type: 'button', class: 'icon-cell', title: glyph, dataset: { icon: glyph },
            'aria-label': glyph,
            onclick: () => { input.value = glyph; setCurrent(glyph); },
        }, [icon(glyph)]);
        grid.appendChild(cell);
    });

    function updatePreview() {
        previewGlyph.replaceChildren(current ? icon(current) : el('span', { class: 'icon-preview-empty' }, '?'));
        previewCode.textContent = current || '(無効なクラス)';
        grid.querySelectorAll('.icon-cell').forEach(cell =>
            cell.classList.toggle('selected', cell.dataset.icon === current));
    }

    function setCurrent(v) {
        current = normalizeIconClass(v);
        updatePreview();
    }

    input.addEventListener('input', () => setCurrent(input.value));
    updatePreview();

    const element = el('div', { class: 'icon-picker' }, [
        preview,
        input,
        el('div', { class: 'icon-palette-wrap' }, [grid]),
    ]);

    return {
        element,
        getValue: () => normalizeIconClass(input.value),
        setValue: (v) => { input.value = normalizeIconClass(v); setCurrent(input.value); },
    };
}

/**
 * カテゴリの追加/編集フォーム（モーダル）。
 * @param {import('../store.js').Store} store
 * @param {{icon:string,label:string}|null} existing 編集対象（新規は null）
 * @returns {Promise<string|null>} 確定した icon、キャンセル時 null
 */
export function openCategoryEditor(store, existing = null) {
    return new Promise((resolve) => {
        let resolved = false;
        const settle = (v) => { if (!resolved) { resolved = true; resolve(v); } };

        const labelInput = el('input', {
            type: 'text', class: 'form-input', 'data-autofocus': 'true',
            value: existing ? existing.label : '', placeholder: '例: 野菜, 肉, 宝石',
        });
        const picker = createIconPicker({ value: existing ? existing.icon : DEFAULT_ICON });
        const errorEl = el('small', { class: 'form-error', role: 'alert' });

        const accept = () => {
            const iconClass = picker.getValue();
            if (!iconClass) { errorEl.textContent = '有効なアイコン（fa-… 形式）を指定してください'; return false; }
            const label = labelInput.value.trim();
            try {
                if (existing) store.updateCategory(existing.icon, { icon: iconClass, label });
                else store.addCategory({ icon: iconClass, label });
            } catch (err) {
                errorEl.textContent = err.message; return false;
            }
            settle(iconClass);
            return true;
        };

        const body = el('div', {}, [
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'カテゴリ名'), labelInput]),
            el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'アイコン'), picker.element, errorEl]),
        ]);

        openModal({
            title: existing ? 'カテゴリを編集' : 'カテゴリを追加',
            body,
            onClose: () => settle(null),
            actions: [
                { label: 'キャンセル', variant: 'ghost' },
                { label: existing ? '更新' : '追加', variant: 'primary', onClick: () => accept() === false },
            ],
        });
    });
}

/**
 * カテゴリ管理モーダル（一覧 + 追加/編集/削除）。
 * @param {import('../store.js').Store} store
 */
export function openCategoryManager(store) {
    const list = el('div', { class: 'category-list' });

    function render() {
        clear(list);
        const cats = store.getCategories();
        list.appendChild(el('div', { class: 'list-count' }, `${cats.length} 件のカテゴリ`));
        if (cats.length === 0) {
            list.appendChild(el('p', { class: 'result-empty' }, 'カテゴリがありません'));
            return;
        }
        const grid = el('div', { class: 'category-grid' });
        cats.forEach(cat => grid.appendChild(buildRow(cat)));
        list.appendChild(grid);
    }

    function buildRow(cat) {
        const used = store.countNodesUsingIcon(cat.icon);
        return el('div', { class: 'category-row' }, [
            el('div', { class: 'category-icon' }, [icon(cat.icon)]),
            el('div', { class: 'category-info' }, [
                el('div', { class: 'category-label' }, cat.label),
                el('code', { class: 'category-code' }, cat.icon),
            ]),
            used ? el('span', { class: 'category-usage' }, `${used} 件で使用`) : null,
            el('div', { class: 'category-actions' }, [
                el('button', { type: 'button', class: 'icon-btn', title: '編集', onclick: () => openCategoryEditor(store, cat) }, [icon('fa-pen')]),
                el('button', { type: 'button', class: 'icon-btn danger', title: '削除', onclick: () => remove(cat) }, [icon('fa-trash')]),
            ]),
        ].filter(Boolean));
    }

    async function remove(cat) {
        const used = store.countNodesUsingIcon(cat.icon);
        const ok = await confirmDialog({
            title: 'カテゴリを削除',
            message: `「${cat.label}」を削除しますか？`,
            detail: used
                ? el('p', {}, `このアイコンは ${used} 件の材料/レシピで使われています。削除しても各アイテムのアイコン表示はそのまま残りますが、選択肢からは消えます。`)
                : null,
            confirmLabel: '削除',
            danger: true,
        });
        if (!ok) return;
        store.deleteCategory(cat.icon);
        notify(`「${cat.label}」を削除しました`, 'success');
    }

    const body = el('div', {}, [
        el('button', { type: 'button', class: 'btn btn-primary btn-sm add-category', onclick: () => openCategoryEditor(store) }, [icon('fa-plus'), ' カテゴリを追加']),
        list,
    ]);

    const unsubscribe = store.subscribe(render);
    render();

    openModal({
        title: 'カテゴリ管理',
        size: 'wide',
        body,
        onClose: () => unsubscribe(),
        actions: [{ label: '閉じる', variant: 'primary' }],
    });
}
