// combobox.js — アクセシブルな単一選択コンボボックス
//
// 旧 custom-dropdown + dropdown-integration（偽 select / MutationObserver /
// setTimeout 競合）を置き換える単一実装。副作用や DOM ハックを持たず、
// 明確な API（getValue/setValue/setOptions）を提供する。
//
// createCombobox({ options, value, placeholder, searchable, allowAdd,
//                  addLabel, onSelect, onAdd }) -> instance

import { el, icon, clear } from './dom.js';

let idCounter = 0;

/**
 * @param {object} config
 * @param {Array<{value:string,label:string,icon?:string,disabled?:boolean}>} [config.options]
 * @param {string} [config.value]
 * @param {string} [config.placeholder]
 * @param {boolean} [config.searchable]
 * @param {boolean} [config.allowAdd]
 * @param {string} [config.addLabel]
 * @param {(value:string)=>void} [config.onSelect]
 * @param {()=>void} [config.onAdd]
 */
export function createCombobox(config = {}) {
    const id = `cbx-${++idCounter}`;
    let options = [];
    let value = '';
    let activeIndex = -1;
    let open = false;

    const {
        placeholder = '選択してください',
        searchable = false,
        allowAdd = false,
        addLabel = '+ 新規追加',
        onSelect,
        onAdd,
    } = config;

    // --- 要素 -------------------------------------------------------------
    const iconSlot = el('span', { class: 'combobox-icon' });
    const textSlot = el('span', { class: 'combobox-text' });
    const button = el('button', {
        type: 'button', class: 'combobox-button', id: `${id}-btn`,
        'aria-haspopup': 'listbox', 'aria-expanded': 'false',
    }, [iconSlot, textSlot, icon('fa-chevron-down', 'combobox-arrow')]);

    const searchInput = searchable
        ? el('input', { type: 'text', class: 'combobox-search-input', placeholder: '検索...', 'aria-label': '検索' })
        : null;
    const searchWrap = searchable
        ? el('div', { class: 'combobox-search' }, [icon('fa-magnifying-glass', 'combobox-search-icon'), searchInput])
        : null;

    const listbox = el('div', { class: 'combobox-options', role: 'listbox', id: `${id}-list`, tabindex: '-1' });

    const addButton = allowAdd
        ? el('button', { type: 'button', class: 'combobox-add', onclick: (e) => { e.stopPropagation(); close(); onAdd && onAdd(); } }, [icon('fa-plus'), ' ', addLabel.replace(/^\+\s*/, '')])
        : null;

    const popover = el('div', { class: 'combobox-popover' },
        [searchWrap, listbox, addButton].filter(Boolean));

    const root = el('div', { class: 'combobox' }, [button, popover]);

    // --- レンダリング -----------------------------------------------------
    function visibleOptions() {
        const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
        return options
            .map((opt, index) => ({ opt, index }))
            .filter(({ opt }) => !opt.disabled && (!term || opt.label.toLowerCase().includes(term)));
    }

    function renderButton() {
        const selected = options.find(o => o.value === value);
        clear(iconSlot);
        if (selected) {
            textSlot.textContent = selected.label;
            textSlot.classList.remove('is-placeholder');
            if (selected.icon) iconSlot.appendChild(icon(selected.icon));
        } else {
            textSlot.textContent = placeholder;
            textSlot.classList.add('is-placeholder');
        }
    }

    function renderList() {
        clear(listbox);
        const vis = visibleOptions();
        if (vis.length === 0) {
            listbox.appendChild(el('div', { class: 'combobox-empty' }, '該当なし'));
            return;
        }
        vis.forEach(({ opt }, vIdx) => {
            const optionEl = el('div', {
                class: 'combobox-option' + (opt.value === value ? ' selected' : '') + (vIdx === activeIndex ? ' active' : ''),
                role: 'option', 'aria-selected': opt.value === value ? 'true' : 'false',
                dataset: { value: opt.value },
                onmouseenter: () => { activeIndex = vIdx; highlight(); },
                onclick: (e) => { e.stopPropagation(); select(opt.value); },
            }, [opt.icon ? icon(opt.icon, 'combobox-option-icon') : null, el('span', {}, opt.label)].filter(Boolean));
            listbox.appendChild(optionEl);
        });
    }

    function highlight() {
        const els = listbox.querySelectorAll('.combobox-option');
        els.forEach((node, i) => {
            node.classList.toggle('active', i === activeIndex);
            if (i === activeIndex) node.scrollIntoView({ block: 'nearest' });
        });
    }

    // --- 開閉 -------------------------------------------------------------
    function openMenu() {
        if (open) return;
        open = true;
        root.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        activeIndex = visibleOptions().findIndex(({ opt }) => opt.value === value);
        renderList();
        if (searchInput) {
            searchInput.value = '';
            renderList();
            setTimeout(() => searchInput.focus(), 0);
        } else {
            setTimeout(() => listbox.focus(), 0);
        }
        document.addEventListener('click', onDocClick, true);
    }

    function close() {
        if (!open) return;
        open = false;
        root.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        activeIndex = -1;
        document.removeEventListener('click', onDocClick, true);
    }

    function toggle() { open ? close() : openMenu(); }

    function onDocClick(e) {
        if (!root.contains(e.target)) close();
    }

    // --- 選択 -------------------------------------------------------------
    function select(v) {
        value = v;
        renderButton();
        close();
        button.focus();
        if (onSelect) onSelect(v);
    }

    function move(delta) {
        const vis = visibleOptions();
        if (vis.length === 0) return;
        activeIndex = (activeIndex + delta + vis.length) % vis.length;
        highlight();
    }

    function acceptActive() {
        const vis = visibleOptions();
        if (activeIndex >= 0 && activeIndex < vis.length) select(vis[activeIndex].opt.value);
    }

    // --- キーボード -------------------------------------------------------
    button.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); openMenu();
        }
    });

    const keyHost = searchInput || listbox;
    keyHost.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); move(1); break;
            case 'ArrowUp': e.preventDefault(); move(-1); break;
            case 'Enter': e.preventDefault(); acceptActive(); break;
            case 'Escape': e.preventDefault(); close(); button.focus(); break;
            case 'Tab': close(); break;
        }
    });
    if (searchInput) {
        searchInput.addEventListener('input', () => { activeIndex = 0; renderList(); });
    }
    button.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

    // 初期化
    setOptions(config.options || []);
    if (config.value != null) setValue(config.value);
    else renderButton();

    // --- 公開 API ---------------------------------------------------------
    function setOptions(next) {
        options = (next || []).map(o => ({
            value: String(o.value),
            label: o.label != null ? String(o.label) : String(o.value),
            icon: o.icon || null,
            disabled: !!o.disabled,
        }));
        // 現在値が候補に無ければクリア
        if (value && !options.some(o => o.value === value)) value = '';
        renderButton();
        if (open) renderList();
    }

    function setValue(v) {
        value = v != null && options.some(o => o.value === String(v)) ? String(v) : '';
        renderButton();
    }

    function getValue() { return value; }

    return {
        element: root,
        getValue,
        setValue,
        setOptions,
        focus: () => button.focus(),
        close,
    };
}
