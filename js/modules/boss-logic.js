// modules/boss-logic.js — ボス出現スケジュールの計算（純粋関数・ローカルタイム）
//
// boss = { id, name, icon, times: [{ day, time }] }
//   day : 0–6（0=日, 1=月, … 6=土）または 'daily'（毎日）
//   time: "HH:MM"（端末ローカルタイム）

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** "HH:MM" を {h, m} に。不正なら null */
export function parseTime(time) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(time || '').trim());
    if (!m) return null;
    const h = Number(m[1]), min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { h, m: min };
}

/**
 * 単一の {day, time} エントリについて、now 以降の次回発生 Date を返す。
 * @returns {Date|null}
 */
export function nextOccurrence(entry, now = new Date()) {
    const t = parseTime(entry.time);
    if (!t) return null;

    const base = new Date(now);
    base.setSeconds(0, 0);

    const candidate = new Date(base);
    candidate.setHours(t.h, t.m, 0, 0);

    if (entry.day === 'daily') {
        if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
        return candidate;
    }

    const day = Number(entry.day);
    if (Number.isNaN(day) || day < 0 || day > 6) return null;

    let diff = (day - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + diff);
    if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 7);
    return candidate;
}

/**
 * 全ボスの今後の出現を昇順で返す。
 * @param {Array} bosses
 * @param {Date} now
 * @param {{horizonHours?:number}} opts 既定 168h（1週間）
 * @returns {{boss:object, entry:object, spawn:Date, msUntil:number}[]}
 */
export function computeUpcoming(bosses, now = new Date(), { horizonHours = 168 } = {}) {
    const horizonMs = horizonHours * 3600 * 1000;
    const out = [];
    for (const boss of bosses || []) {
        for (const entry of boss.times || []) {
            const spawn = nextOccurrence(entry, now);
            if (!spawn) continue;
            const msUntil = spawn.getTime() - now.getTime();
            if (msUntil >= 0 && msUntil <= horizonMs) {
                out.push({ boss, entry, spawn, msUntil });
            }
        }
    }
    out.sort((a, b) => a.msUntil - b.msUntil);
    return out;
}

/** ミリ秒を "残り Dd HH:MM:SS" 形式に */
export function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const hms = `${pad(h)}:${pad(m)}:${pad(s)}`;
    return d > 0 ? `${d}日 ${hms}` : hms;
}

/** 出現時刻の短い表示（例: 「月 21:00」 / 「毎日 12:00」） */
export function formatSpawnLabel(entry) {
    const dayLabel = entry.day === 'daily' ? '毎日' : (WEEKDAYS[Number(entry.day)] || '?');
    return `${dayLabel} ${entry.time}`;
}
