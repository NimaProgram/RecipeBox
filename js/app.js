// app.js — アプリのエントリポイント。状態・永続化・描画を結線する。

import { Store } from './store.js';
import {
    initPersistence, exportToFile, importFromFile, createBackupFile,
    listBackups, restoreBackup, clearAllStorage,
} from './persistence.js';
import { ThemeManager } from './theme.js';
import { el, icon, clear } from './dom.js';
import { openModal, confirmDialog, notify } from './dialogs.js';
import { createCombobox } from './combobox.js';
import { buildTree, setTreeCollapsed } from './views/tree.js';
import { renderMaterials } from './views/materials.js';
import { openRecipeForm } from './views/recipeForm.js';
import { openRecipeList } from './views/recipeList.js';
import { renderWelcome } from './views/welcome.js';

const store = new Store();
const theme = new ThemeManager();

/** 描画をまたいで保持する UI 状態 */
const ui = { selected: '', quantity: 100 };

let appRoot;
let themeBtn;

// --- 起動 -----------------------------------------------------------------
function boot() {
    appRoot = document.getElementById('app');
    setupHeader();
    initPersistence(store);          // 旧データは migrate 済みで読み込まれる
    store.subscribe(render);         // 構造変化で再描画
    render();
    registerServiceWorker();
}

function setupHeader() {
    themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        updateThemeIcon();
        themeBtn.addEventListener('click', () => { theme.toggle(); updateThemeIcon(); });
    }
}

function updateThemeIcon() {
    if (!themeBtn) return;
    const dark = theme.getTheme() === 'dark';
    themeBtn.replaceChildren(icon(dark ? 'fa-moon' : 'fa-sun'));
    themeBtn.title = dark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え';
}

// --- 描画 -----------------------------------------------------------------
function render() {
    if (!appRoot) return;
    clear(appRoot);
    if (store.isEmpty()) {
        appRoot.appendChild(renderWelcome({ onCreate: () => openRecipeForm(store), onImport: doImport }));
    } else {
        appRoot.appendChild(renderWorkspace());
    }
}

function renderWorkspace() {
    // 選択レシピの妥当性検証
    const selectable = store.getRecipesWithIngredients();
    if (ui.selected && !selectable.some(r => r.name === ui.selected)) ui.selected = '';

    return el('div', { class: 'workspace' }, [
        renderToolbar(),
        el('div', { class: 'workspace-grid' }, [
            renderRecipePanel(selectable),
            renderCalculatorPanel(),
        ]),
    ]);
}

function renderToolbar() {
    const stats = store.getStats();
    return el('div', { class: 'toolbar' }, [
        el('div', { class: 'toolbar-stats' }, [
            statChip('fa-book', stats.recipes, 'レシピ'),
            statChip('fa-cube', stats.basicItems, '基本材料'),
        ]),
        el('div', { class: 'toolbar-actions' }, [
            toolBtn('fa-plus', 'レシピ追加', 'primary', () => openRecipeForm(store)),
            toolBtn('fa-list', '一覧', 'ghost', () => openRecipeList(store, { onSelect: selectRecipe })),
            toolBtn('fa-download', 'エクスポート', 'ghost', doExport),
            toolBtn('fa-upload', 'インポート', 'ghost', doImport),
            toolBtn('fa-clock-rotate-left', 'バックアップ', 'ghost', openBackupList),
            toolBtn('fa-trash', '全削除', 'danger-ghost', doClearAll),
        ]),
    ]);
}

function statChip(ic, value, label) {
    return el('div', { class: 'stat-chip' }, [
        icon(ic, 'stat-chip-icon'),
        el('span', { class: 'stat-chip-value' }, String(value)),
        el('span', { class: 'stat-chip-label' }, label),
    ]);
}

function toolBtn(ic, label, variant, onClick) {
    return el('button', { type: 'button', class: `btn btn-${variant} btn-sm`, onclick: onClick }, [icon(ic), ' ', label]);
}

function renderRecipePanel(selectable) {
    const selector = createCombobox({
        options: selectable.map(r => ({ value: r.name, label: r.name, icon: r.icon || 'fa-utensils' })),
        value: ui.selected,
        placeholder: '計算するレシピを選択...',
        searchable: true,
        onSelect: selectRecipe,
    });

    const treeHost = el('div', { class: 'tree-host' });

    if (ui.selected) {
        const treeEl = buildTree(store, ui.selected);
        const controls = el('div', { class: 'tree-controls' }, [
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setTreeCollapsed(treeEl, false) }, [icon('fa-angles-down'), ' 全展開']),
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setTreeCollapsed(treeEl, true) }, [icon('fa-angles-up'), ' 全折りたたみ']),
        ]);
        treeHost.append(controls, treeEl);
    } else {
        treeHost.appendChild(el('p', { class: 'panel-hint' }, 'レシピを選択すると構成ツリーが表示されます'));
    }

    return el('section', { class: 'panel' }, [
        el('div', { class: 'panel-head' }, [icon('fa-sitemap'), el('h2', {}, 'レシピ構成')]),
        el('div', { class: 'panel-body' }, [
            el('div', { class: 'field' }, [el('label', { class: 'form-label' }, '計算対象'), selector.element]),
            treeHost,
        ]),
    ]);
}

function renderCalculatorPanel() {
    const qtyInput = el('input', { type: 'number', min: '1', class: 'form-input', value: String(ui.quantity), 'aria-label': '作りたい個数' });
    const resultHost = el('div', { class: 'result-host' });

    const compute = () => {
        ui.quantity = Math.max(1, Math.floor(Number(qtyInput.value) || 1));
        qtyInput.value = String(ui.quantity);
        clear(resultHost);
        if (!ui.selected) {
            resultHost.appendChild(el('p', { class: 'result-empty' }, 'まず計算対象のレシピを選択してください'));
            return;
        }
        resultHost.appendChild(renderMaterials(store, ui.selected, ui.quantity));
    };

    qtyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') compute(); });

    // 選択済みなら初期表示
    compute();

    return el('section', { class: 'panel' }, [
        el('div', { class: 'panel-head' }, [icon('fa-calculator'), el('h2', {}, '材料計算')]),
        el('div', { class: 'panel-body' }, [
            el('div', { class: 'calc-input' }, [
                el('label', { class: 'form-label' }, '作りたい個数'),
                el('div', { class: 'calc-row' }, [
                    qtyInput,
                    el('button', { type: 'button', class: 'btn btn-primary', onclick: compute }, [icon('fa-play'), ' 計算']),
                ]),
            ]),
            resultHost,
        ]),
    ]);
}

// --- アクション -----------------------------------------------------------
function selectRecipe(name) {
    ui.selected = name;
    render();
}

function doExport() {
    exportToFile(store);
    notify('データをエクスポートしました', 'success');
}

async function doImport() {
    try {
        const ok = await importFromFile(store);
        if (ok) notify('データを読み込みました', 'success');
    } catch (err) {
        notify(`読み込みエラー: ${err.message}`, 'error');
    }
}

async function doClearAll() {
    const ok = await confirmDialog({
        title: '全データ削除',
        message: 'すべてのレシピデータとバックアップを削除しますか？',
        detail: el('p', { class: 'text-danger' }, 'この操作は取り消せません。'),
        confirmLabel: 'すべて削除',
        danger: true,
    });
    if (!ok) return;
    clearAllStorage(store);
    ui.selected = '';
    notify('すべてのデータを削除しました', 'success');
}

function openBackupList() {
    const backups = listBackups();
    if (backups.length === 0) {
        notify('利用可能なバックアップがありません', 'info');
        return;
    }
    const body = el('div', { class: 'backup-list' },
        backups.map(({ key, date }) => el('div', { class: 'backup-row' }, [
            el('div', { class: 'backup-info' }, [
                icon('fa-clock-rotate-left'),
                el('span', {}, date.toLocaleString('ja-JP')),
            ]),
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: async () => {
                const ok = await confirmDialog({ title: 'バックアップから復元', message: 'このバックアップで現在のデータを置き換えますか？', confirmLabel: '復元' });
                if (!ok) return;
                try { restoreBackup(store, key); ui.selected = ''; notify('バックアップから復元しました', 'success'); modal.close(); }
                catch (err) { notify(`復元エラー: ${err.message}`, 'error'); }
            } }, [icon('fa-rotate-left'), ' 復元']),
        ])));

    const modal = openModal({
        title: 'バックアップ',
        size: 'narrow',
        body,
        actions: [
            { label: 'エクスポートで保存', variant: 'ghost', onClick: () => { createBackupFile(store); notify('バックアップファイルを保存しました', 'success'); } },
            { label: '閉じる', variant: 'primary' },
        ],
    });
}

// --- Service Worker -------------------------------------------------------
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW 登録失敗:', err));
    });
}

// 起動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
