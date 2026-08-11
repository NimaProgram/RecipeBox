// modules/boss-store.js — ボス出現スケジュールの状態・永続化（RecipeBox とは独立）

import { normalizeIconClass } from '../icons.js';

const STORAGE_KEY = 'bossSchedule';
const CURRENT_SCHEMA = 1;
const APP_ID = 'MMOToolkit';
const DEFAULT_BOSS_ICON = 'fa-dragon';

function genId() {
    return 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function padTime(time) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(time || '').trim());
    if (!m) return null;
    const h = Number(m[1]), min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function normalizeTimes(rawTimes) {
    const times = [];
    for (const t of rawTimes || []) {
        if (!t || typeof t !== 'object') continue;
        const time = padTime(t.time);
        if (!time) continue;
        let day = t.day;
        if (day !== 'daily') {
            day = Number(day);
            if (Number.isNaN(day) || day < 0 || day > 6) continue;
        }
        times.push({ day, time });
    }
    return times;
}

function normalizeBoss(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    return {
        id: typeof r.id === 'string' && r.id ? r.id : genId(),
        name: String(r.name || '').trim() || '名称未設定',
        icon: normalizeIconClass(r.icon) || DEFAULT_BOSS_ICON,
        times: normalizeTimes(r.times),
    };
}

/** 任意入力（文字列/オブジェクト）を正規化して bosses 配列を返す */
export function migrate(input) {
    let data = input;
    if (typeof data === 'string') data = JSON.parse(data);
    if (!data || typeof data !== 'object') throw new Error('無効なデータ形式です');
    const rawBosses = Array.isArray(data.bosses) ? data.bosses : [];
    return rawBosses.map(normalizeBoss);
}

/** 黒い砂漠風のサンプル（編集可能・任意で読込） */
export const SAMPLE_BOSSES = [
    { name: 'クザカ', icon: 'fa-dragon', times: [{ day: 1, time: '12:00' }, { day: 4, time: '21:00' }, { day: 6, time: '15:00' }] },
    { name: 'カラング', icon: 'fa-skull', times: [{ day: 2, time: '20:00' }, { day: 5, time: '13:00' }] },
    { name: 'ヌベル', icon: 'fa-spaghetti-monster-flying', times: [{ day: 0, time: '18:00' }, { day: 3, time: '10:00' }] },
];

export class BossStore {
    constructor() {
        /** @type {{id:string,name:string,icon:string,times:{day:any,time:string}[]}[]} */
        this.bosses = [];
        this._subs = new Set();
        this._saveTimer = null;
        this._loadFromStorage();
    }

    subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }
    emit() {
        for (const fn of this._subs) { try { fn(this); } catch (e) { console.error('boss subscriber error:', e); } }
        this._scheduleSave();
    }

    getBosses() { return this.bosses; }
    getBoss(id) { return this.bosses.find(b => b.id === id); }
    isEmpty() { return this.bosses.length === 0; }

    /** 追加 or 更新（id があれば更新） */
    upsertBoss(data) {
        const boss = normalizeBoss(data);
        const idx = this.bosses.findIndex(b => b.id === boss.id);
        if (idx >= 0) this.bosses[idx] = boss;
        else this.bosses.push(boss);
        this.emit();
        return boss.id;
    }

    deleteBoss(id) {
        const before = this.bosses.length;
        this.bosses = this.bosses.filter(b => b.id !== id);
        if (this.bosses.length !== before) this.emit();
    }

    loadSample() {
        this.bosses = SAMPLE_BOSSES.map(normalizeBoss);
        this.emit();
    }

    clear() { this.bosses = []; this.emit(); }

    toJSON() {
        return { schemaVersion: CURRENT_SCHEMA, app: APP_ID, exportedAt: new Date().toISOString(), bosses: this.bosses };
    }

    load(input) {
        this.bosses = migrate(input);
        this.emit();
    }

    // --- 永続化（自己完結・小データのためデバウンス保存） -----------------
    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) this.bosses = migrate(raw);
        } catch (e) { console.error('boss load error:', e); }
    }

    _scheduleSave() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON())); }
            catch (e) { console.error('boss save error:', e); }
        }, 300);
    }
}
