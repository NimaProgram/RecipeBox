// modules/boss.js — ボス出現カウントダウン モジュール（一覧・編集・PiP）

import { el, icon, clear } from '../dom.js';
import { openModal, confirmDialog, notify } from '../dialogs.js';
import { createIconPicker } from '../views/categories.js';
import { openPipWindow, isPipSupported } from '../views/pip-host.js';
import { computeUpcoming, formatCountdown, formatSpawnLabel, WEEKDAYS } from './boss-logic.js';
import { alertBeep, isMuted, toggleMuted } from '../beep.js';

const IMMINENT_MS = 5 * 60 * 1000; // 5分前で強調＋通知
const DEFAULT_BOSS_ICON = 'fa-dragon';

// --- 共有カウントダウンビュー（本体 / PiP 双方で使用） ---------------------

/**
 * カウントダウン一覧の要素を作り、1秒ごとに残り時間を更新する。
 * @param {import('./boss-store.js').BossStore} bossStore
 * @returns {{element:HTMLElement, dispose:Function}}
 */
export function createCountdownView(bossStore, { emptyExtra } = {}) {
    const listEl = el('div', { class: 'boss-countdown' });
    let rows = [];
    const alerted = new Set();

    function rebuild() {
        const now = new Date();
        const upcoming = computeUpcoming(bossStore.getBosses(), now, { horizonHours: 168 }).slice(0, 30);
        clear(listEl);
        rows = [];

        if (bossStore.isEmpty()) {
            listEl.appendChild(el('div', { class: 'boss-empty' }, [
                el('p', { class: 'result-empty' }, 'タイムテーブルが空です。「タイムテーブル編集」から登録してください。'),
                emptyExtra || null,
            ].filter(Boolean)));
            return;
        }
        if (upcoming.length === 0) {
            listEl.appendChild(el('p', { class: 'result-empty' }, '今後1週間の出現予定がありません'));
            return;
        }

        for (const u of upcoming) {
            const remainingEl = el('span', { class: 'boss-remaining' });
            const rowEl = el('div', { class: 'boss-row' }, [
                el('div', { class: 'boss-row-icon' }, [icon(u.boss.icon || DEFAULT_BOSS_ICON)]),
                el('div', { class: 'boss-row-info' }, [
                    el('div', { class: 'boss-row-name', title: u.boss.name }, u.boss.name),
                    el('div', { class: 'boss-row-time' }, [icon('fa-clock', 'boss-row-time-icon'), ' ', formatSpawnLabel(u.entry)]),
                ]),
                el('div', { class: 'boss-remaining-wrap' }, [el('span', { class: 'boss-remaining-label' }, 'あと'), remainingEl]),
            ]);
            rows.push({
                key: `${u.boss.id}|${u.entry.day}|${u.entry.time}|${u.spawn.getTime()}`,
                spawnMs: u.spawn.getTime(), remainingEl, rowEl,
            });
            listEl.appendChild(rowEl);
        }
        tick();
    }

    function tick() {
        const now = Date.now();
        let needsRebuild = false;
        for (const r of rows) {
            const remaining = r.spawnMs - now;
            if (remaining <= 0) { needsRebuild = true; continue; }
            r.remainingEl.textContent = formatCountdown(remaining);
            const imminent = remaining <= IMMINENT_MS;
            r.rowEl.classList.toggle('imminent', imminent);
            if (imminent && !alerted.has(r.key)) { alerted.add(r.key); alertBeep(); }
        }
        if (needsRebuild) rebuild();
    }

    const unsubscribe = bossStore.subscribe(rebuild);
    rebuild();
    const timer = setInterval(tick, 1000);

    return { element: listEl, dispose() { clearInterval(timer); unsubscribe(); } };
}

// --- 本体モジュール --------------------------------------------------------

/**
 * ボスモジュールを container に描画。
 * @returns {{dispose:Function}}
 */
export function mountBoss(container, bossStore) {
    const sampleBtn = toolBtn('fa-wand-magic-sparkles', 'サンプル（黒い砂漠風）を読込', 'ghost', () => bossStore.loadSample());
    const view = createCountdownView(bossStore, { emptyExtra: sampleBtn });

    const muteBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { toggleMuted(); syncMute(); } });
    function syncMute() {
        const muted = isMuted();
        muteBtn.replaceChildren(icon(muted ? 'fa-volume-xmark' : 'fa-volume-high'), document.createTextNode(muted ? ' 通知音OFF' : ' 通知音ON'));
        muteBtn.title = muted ? '通知音: OFF（クリックでON）' : '通知音: ON（クリックでOFF）';
    }
    syncMute();

    const actions = [
        toolBtn('fa-table-list', 'タイムテーブル編集', 'primary', () => openTimetableEditor(bossStore)),
        muteBtn,
    ];
    if (isPipSupported()) actions.push(toolBtn('fa-window-restore', 'PiP', 'ghost', () => openBossPip(bossStore)));

    const header = el('div', { class: 'boss-header' }, [
        el('div', { class: 'panel-head-title' }, [icon('fa-dragon'), el('h2', {}, 'ボス出現カウントダウン')]),
        el('div', { class: 'boss-header-actions' }, actions),
    ]);

    const note = el('p', { class: 'boss-note' }, '時刻は端末のローカルタイムで判定しています。出現5分前に強調表示と通知音でお知らせします。');

    const section = el('section', { class: 'boss-module' }, [header, note, view.element]);
    container.appendChild(section);

    // サンプル読込などでの空→非空に追従してヘッダーのボタンを出し分けたいが、
    // ここでは簡潔さのため store 変化時にモジュール全体を作り直す方式を app 側に委ねる。
    return { dispose: view.dispose };
}

function toolBtn(ic, label, variant, onClick) {
    return el('button', { type: 'button', class: `btn btn-${variant} btn-sm`, onclick: onClick }, [icon(ic), ' ', label]);
}

// --- PiP -------------------------------------------------------------------

export function openBossPip(bossStore) {
    return openPipWindow({
        title: 'MMO Toolkit — ボス出現',
        width: 340, height: 520,
        mount: (win, container) => {
            const controls = el('div', { class: 'pip-controls' }, [
                el('div', { class: 'pip-title' }, [icon('fa-dragon'), ' ボス出現']),
            ]);
            const content = el('div', { class: 'pip-content' });
            const view = createCountdownView(bossStore);
            content.appendChild(view.element);
            container.append(controls, content);
            return { dispose: view.dispose };
        },
    });
}

// --- タイムテーブル編集 ----------------------------------------------------

export function openTimetableEditor(bossStore) {
    const list = el('div', { class: 'boss-edit-list' });

    function render() {
        clear(list);
        const bosses = bossStore.getBosses();
        list.appendChild(el('div', { class: 'list-count' }, `${bosses.length} 体のボス`));
        if (bosses.length === 0) {
            list.appendChild(el('p', { class: 'result-empty' }, 'まだボスがありません。「ボスを追加」から登録してください。'));
            return;
        }
        const grid = el('div', { class: 'boss-edit-grid' });
        bosses.forEach(b => grid.appendChild(buildRow(b)));
        list.appendChild(grid);
    }

    function buildRow(boss) {
        const summary = boss.times.length
            ? boss.times.map(formatSpawnLabel).join('、')
            : '時刻未設定';
        return el('div', { class: 'boss-edit-row' }, [
            el('div', { class: 'boss-row-icon' }, [icon(boss.icon || DEFAULT_BOSS_ICON)]),
            el('div', { class: 'boss-row-info' }, [
                el('div', { class: 'boss-row-name' }, boss.name),
                el('div', { class: 'boss-edit-times', title: summary }, summary),
            ]),
            el('div', { class: 'boss-edit-actions' }, [
                el('button', { type: 'button', class: 'icon-btn', title: '編集', onclick: () => openBossEditor(bossStore, boss) }, [icon('fa-pen')]),
                el('button', { type: 'button', class: 'icon-btn danger', title: '削除', onclick: () => remove(boss) }, [icon('fa-trash')]),
            ]),
        ]);
    }

    async function remove(boss) {
        const ok = await confirmDialog({ title: 'ボスを削除', message: `「${boss.name}」を削除しますか？`, confirmLabel: '削除', danger: true });
        if (!ok) return;
        bossStore.deleteBoss(boss.id);
        notify(`「${boss.name}」を削除しました`, 'success');
    }

    const body = el('div', {}, [
        el('div', { class: 'boss-edit-toolbar' }, [
            toolBtn('fa-plus', 'ボスを追加', 'primary', () => openBossEditor(bossStore, null)),
            toolBtn('fa-download', 'エクスポート', 'ghost', () => exportTimetable(bossStore)),
            toolBtn('fa-upload', 'インポート', 'ghost', () => importTimetable(bossStore)),
        ]),
        list,
    ]);

    const unsubscribe = bossStore.subscribe(render);
    render();
    openModal({
        title: 'タイムテーブル編集',
        size: 'wide',
        body,
        onClose: () => unsubscribe(),
        actions: [{ label: '閉じる', variant: 'primary' }],
    });
}

function openBossEditor(bossStore, existing) {
    const nameInput = el('input', { type: 'text', class: 'form-input', 'data-autofocus': 'true', value: existing ? existing.name : '', placeholder: '例: クザカ, ゴールデンドラゴン' });
    const picker = createIconPicker({ value: existing ? existing.icon : DEFAULT_BOSS_ICON });
    const errorEl = el('small', { class: 'form-error', role: 'alert' });

    const timesList = el('div', { class: 'boss-times-list' });
    const timeRows = [];

    function addTimeRow(day = 1, time = '21:00') {
        const daySel = el('select', { class: 'form-input boss-day-select', 'aria-label': '曜日' });
        daySel.appendChild(optionEl('daily', '毎日', day === 'daily'));
        WEEKDAYS.forEach((label, i) => daySel.appendChild(optionEl(String(i), label + '曜', String(day) === String(i))));
        const timeInput = el('input', { type: 'time', class: 'form-input boss-time-input', value: time, 'aria-label': '時刻' });
        const removeBtn = el('button', { type: 'button', class: 'icon-btn', title: '削除', onclick: () => { const i = timeRows.findIndex(r => r.row === row); if (i >= 0) timeRows.splice(i, 1); row.remove(); } }, [icon('fa-xmark')]);
        const row = el('div', { class: 'boss-time-row' }, [daySel, timeInput, removeBtn]);
        timeRows.push({ row, daySel, timeInput });
        timesList.appendChild(row);
    }

    if (existing && existing.times.length) existing.times.forEach(t => addTimeRow(t.day, t.time));
    else addTimeRow();

    const body = el('div', {}, [
        el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'ボス名'), nameInput]),
        el('div', { class: 'form-group' }, [el('label', { class: 'form-label' }, 'アイコン'), picker.element]),
        el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '出現時刻（曜日 × 時刻）'),
            timesList,
            el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => addTimeRow() }, [icon('fa-plus'), ' 時刻を追加']),
            errorEl,
        ]),
    ]);

    function save() {
        const name = nameInput.value.trim();
        if (!name) { errorEl.textContent = 'ボス名を入力してください'; return false; }
        const times = [];
        for (const r of timeRows) {
            const t = r.timeInput.value;
            if (!/^\d{1,2}:\d{2}$/.test(t)) continue;
            const dayVal = r.daySel.value === 'daily' ? 'daily' : Number(r.daySel.value);
            times.push({ day: dayVal, time: t });
        }
        if (times.length === 0) { errorEl.textContent = '出現時刻を1つ以上入力してください'; return false; }
        bossStore.upsertBoss({ id: existing ? existing.id : undefined, name, icon: picker.getValue() || DEFAULT_BOSS_ICON, times });
        notify(`「${name}」を保存しました`, 'success');
        return true;
    }

    openModal({
        title: existing ? 'ボスを編集' : 'ボスを追加',
        body,
        actions: [
            { label: 'キャンセル', variant: 'ghost' },
            { label: '保存', variant: 'primary', onClick: () => save() === false },
        ],
    });
    setTimeout(() => nameInput.focus(), 0);
}

function optionEl(value, label, selected) {
    const o = el('option', { value }, label);
    if (selected) o.selected = true;
    return o;
}

// --- 入出力 ----------------------------------------------------------------

function exportTimetable(bossStore) {
    const blob = new Blob([JSON.stringify(bossStore.toJSON(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'boss-timetable.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('タイムテーブルをエクスポートしました', 'success');
}

function importTimetable(bossStore) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try { bossStore.load(reader.result); notify('タイムテーブルを読み込みました', 'success'); }
            catch (err) { notify(`読み込みエラー: ${err.message}`, 'error'); }
        };
        reader.readAsText(file);
    });
    input.click();
}
