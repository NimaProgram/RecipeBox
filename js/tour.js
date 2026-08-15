// tour.js — 汎用ガイドツアー（スポットライト＋ツールチップ）
//
// 依存追加なし・CSP適合（インライン style/script 不使用、位置は CSSOM の
// 個別プロパティで設定）。スポットライトは pointer-events:none にして、
// 下の要素をそのまま実操作できる（＝実際に入力・クリックして進める）。
//
// step = {
//   target: string | (()=>Element|null) | null,   // null は中央カード
//   title, body,                                   // 文字列
//   action: 'button' | 'click' | 'input',          // 進み方（既定 'button'）
//   label,                                          // ボタン文言（既定「次へ」）
//   wait,                                           // 対象出現待ち（既定 true）
// }

import { el, icon, clear } from './dom.js';

let active = false;
let steps = [];
let index = 0;
let opts = {};
let stepCleanup = null;
let reposition = null;

let spotlight = null;
let tip = null;
let currentTarget = null;

const PAD = 6;      // スポットライトの余白
const POLL_MS = 100;
const WAIT_MS = 5000;

export function isTourActive() { return active; }

/** ツアー開始 */
export function startTour(stepList, options = {}) {
    if (active) endTour(true);
    steps = Array.isArray(stepList) ? stepList : [];
    if (steps.length === 0) return;
    opts = options;
    index = 0;
    active = true;

    spotlight = el('div', { class: 'tour-spotlight', 'aria-hidden': 'true' });
    tip = el('div', { class: 'tour-tip', role: 'dialog', 'aria-modal': 'false' });
    document.body.appendChild(spotlight);
    document.body.appendChild(tip);

    reposition = () => positionFor(currentTarget);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('keydown', onKey, true);

    showStep();
}

/** ツアー終了 */
export function endTour(silent = false) {
    if (!active) return;
    active = false;
    if (stepCleanup) { try { stepCleanup(); } catch { /* noop */ } stepCleanup = null; }
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('resize', reposition);
    document.removeEventListener('keydown', onKey, true);
    spotlight && spotlight.remove();
    tip && tip.remove();
    spotlight = tip = currentTarget = null;
    if (!silent && opts.onFinish) opts.onFinish();
}

function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(); }
}

function next() {
    if (stepCleanup) { try { stepCleanup(); } catch { /* noop */ } stepCleanup = null; }
    index += 1;
    if (index >= steps.length) { endTour(); return; }
    showStep();
}

/** 対象を（出現待ちしつつ）解決して Element|null を返す */
function resolveTarget(step) {
    return new Promise((resolve) => {
        const get = () => {
            if (step.target == null) return null;
            if (typeof step.target === 'function') { try { return step.target(); } catch { return null; } }
            return document.querySelector(step.target);
        };
        if (step.target == null) { resolve(null); return; }
        const immediate = get();
        if (immediate) { resolve(immediate); return; }
        if (step.wait === false) { resolve(null); return; }
        const start = Date.now();
        const iv = setInterval(() => {
            const found = get();
            if (found) { clearInterval(iv); resolve(found); }
            else if (Date.now() - start > WAIT_MS) { clearInterval(iv); resolve(null); }
        }, POLL_MS);
        // 現ステップのクリーンアップで待機も止める
        const prev = stepCleanup;
        stepCleanup = () => { clearInterval(iv); if (prev) prev(); };
    });
}

async function showStep() {
    const step = steps[index];
    const target = await resolveTarget(step);
    if (!active) return; // 途中で終了した場合
    currentTarget = target;

    if (target && target.scrollIntoView) {
        try { target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch { /* noop */ }
    }

    renderTip(step, target);
    positionFor(target);
    wireAdvance(step, target);
}

function renderTip(step, target) {
    clear(tip);
    const total = steps.length;

    const header = el('div', { class: 'tour-tip-head' }, [
        el('span', { class: 'tour-progress' }, `${index + 1} / ${total}`),
        el('button', { type: 'button', class: 'tour-skip', onclick: () => endTour() }, 'スキップ'),
    ]);
    const bodyEl = el('div', { class: 'tour-tip-body' }, [
        step.title ? el('h3', { class: 'tour-tip-title' }, step.title) : null,
        step.body ? el('p', { class: 'tour-tip-text' }, step.body) : null,
    ].filter(Boolean));

    const footer = el('div', { class: 'tour-tip-foot' });
    // 'click' 以外は進むボタンを出す（'click' は対象クリックで進む）
    if (step.action !== 'click') {
        const isLast = index === steps.length - 1;
        const label = step.label || (isLast ? '終了' : (index === 0 ? '始める' : '次へ'));
        footer.appendChild(el('button', { type: 'button', class: 'btn btn-primary btn-sm tour-next', onclick: () => next() }, label));
    } else {
        footer.appendChild(el('span', { class: 'tour-hint' }, [icon('fa-arrow-pointer'), ' 実際に操作して進みます']));
    }

    tip.append(header, bodyEl, footer);
    // 対象なし（中央カード）
    tip.classList.toggle('centered', !target);
    spotlight.style.display = target ? 'block' : 'none';
}

function wireAdvance(step, target) {
    const extra = [];
    if (step.action === 'click' && target) {
        const h = (e) => { if (target === e.target || target.contains(e.target)) { setTimeout(next, 0); } };
        document.addEventListener('click', h, true);
        extra.push(() => document.removeEventListener('click', h, true));
    } else if (step.action === 'input' && target) {
        const h = () => { if (String(target.value || '').trim()) next(); };
        target.addEventListener('input', h);
        extra.push(() => target.removeEventListener('input', h));
    }
    if (extra.length) {
        const prev = stepCleanup;
        stepCleanup = () => { extra.forEach(fn => fn()); if (prev) prev(); };
    }
}

/** スポットライトとツールチップを対象に合わせて配置 */
function positionFor(target) {
    if (!spotlight || !tip) return;
    const vw = window.innerWidth, vh = window.innerHeight;

    if (!target) {
        // 中央カード
        spotlight.style.display = 'none';
        tip.style.left = `${Math.max(12, (vw - tip.offsetWidth) / 2)}px`;
        tip.style.top = `${Math.max(12, (vh - tip.offsetHeight) / 2)}px`;
        return;
    }

    const r = target.getBoundingClientRect();
    spotlight.style.display = 'block';
    spotlight.style.top = `${r.top - PAD}px`;
    spotlight.style.left = `${r.left - PAD}px`;
    spotlight.style.width = `${r.width + PAD * 2}px`;
    spotlight.style.height = `${r.height + PAD * 2}px`;

    // ツールチップ位置（下に置けなければ上、収まらなければ横にクランプ）
    const tw = tip.offsetWidth || 300;
    const th = tip.offsetHeight || 120;
    const gap = 12;
    let top = r.bottom + gap;
    if (top + th > vh - 8) top = r.top - gap - th;      // 上に反転
    if (top < 8) top = Math.min(vh - th - 8, Math.max(8, r.bottom + gap)); // 収まらない場合
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, vw - tw - 8));
    tip.style.top = `${Math.max(8, top)}px`;
    tip.style.left = `${left}px`;
}
