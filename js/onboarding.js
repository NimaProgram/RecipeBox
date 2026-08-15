// onboarding.js — 新規訪問者向けチュートリアル（レシピ作成ツアー）の手順と起動制御

import { startTour } from './tour.js';

const FLAG = 'mmoToolkitOnboarded';

export function hasOnboarded() { return localStorage.getItem(FLAG) === '1'; }
export function markOnboarded() { localStorage.setItem(FLAG, '1'); }

/** 「レシピ作成を開く」対象は welcome の作成ボタン or ツールバーの追加ボタン */
function openCreateTarget() {
    return document.querySelector('[data-tour="welcome-create"]')
        || document.querySelector('[data-tour="toolbar-add"]');
}

/** 重複しないサンプル名を返す（再生時の「既に存在します」を回避） */
function sampleRecipeName(store) {
    const base = 'チーズパイ';
    let name = base, n = 2;
    while (store && store.hasRecipe && store.hasRecipe(name)) name = base + n++;
    return name;
}

/**
 * チュートリアル用サンプル（黒い砂漠「チーズパイ」実レシピ）。
 * チーズ7 / バター3 / 卵3 / 小麦粉生地4（基本作成数 1）。
 */
function cheesePieTemplate(store) {
    return {
        name: sampleRecipeName(store),
        baseQuantity: 1,
        icon: 'fa-cheese',
        ingredients: [
            { name: 'チーズ', qty: 7, icon: 'fa-cheese' },
            { name: 'バター', qty: 3, icon: 'fa-cube' },
            { name: '卵', qty: 3, icon: 'fa-egg' },
            { name: '小麦粉生地', qty: 4, icon: 'fa-wheat-awn' },
        ],
    };
}

// フォーム作成時に投入するプリフィル（作成ボタン押下時に app 側が取り出す）
let pendingPrefill = null;
export function consumeOnboardingPrefill() {
    const p = pendingPrefill;
    pendingPrefill = null;
    return p;
}

function buildSteps(store) {
    const tpl = cheesePieTemplate(store);
    return [
        {
            target: null,
            title: 'MMO Toolkit へようこそ',
            body: '黒い砂漠の「チーズパイ」を例に、レシピ作成を一緒に体験しましょう（1分ほど）。いつでも「スキップ」や Esc で終了できます。',
            action: 'button', label: '始める',
        },
        {
            target: openCreateTarget,
            title: 'レシピ作成を開く',
            body: 'まずはここをクリックして、レシピ作成フォームを開きます。サンプル（チーズパイ）を入力済みの状態で開きます。',
            action: 'click',
            onShow: () => { pendingPrefill = tpl; },
        },
        {
            target: '[data-tour="rf-name"]',
            title: 'レシピ名',
            body: 'レシピ／アイテムの名前です。例として「チーズパイ」を入れてあります（自由に変更できます）。',
            action: 'button',
            onShow: (elm) => { if (elm && !String(elm.value).trim()) elm.value = tpl.name; },
        },
        {
            target: '[data-tour="rf-baseqty"]',
            title: '基本作成数',
            body: '1回の作成でできる個数です。チーズパイは 1 です。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-icon"]',
            title: 'アイコン（＝カテゴリ）',
            body: 'アイコンはカテゴリとして機能します。分類に使えます。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-ingredients"]',
            title: '材料',
            body: 'チーズパイの材料（チーズ7・バター3・卵3・小麦粉生地4）を入力済みです。「材料を追加」で行を増やしたり、選択欄の「新しい材料を追加」で新規材料も作れます。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-save"]',
            title: '保存',
            body: 'このまま「保存」でチーズパイが完成します。クリックしてみましょう。',
            action: 'click',
        },
        {
            target: '[data-tour="calc-select"]',
            title: 'レシピを選択',
            body: '作った「チーズパイ」を選ぶと、材料の構成ツリーが表示されます。',
            action: 'button',
        },
        {
            target: '[data-tour="calc-qty"]',
            title: '個数を入力して計算',
            body: '作りたい個数を入れて「計算」すると、必要な材料（チーズ・バター・卵・小麦粉生地）がまとめて表示されます。',
            action: 'button',
        },
        {
            target: null,
            title: '完了！',
            body: 'これで基本操作はOKです。ヘッダーの「?」からいつでもこの案内を再生できます。上部タブの「ボス出現」など他の機能もどうぞ。',
            action: 'button', label: '終了',
        },
    ];
}

function endCleanup() { markOnboarded(); pendingPrefill = null; }

/**
 * 初回訪問（未オンボーディング＋レシピ在庫が空）のとき自動起動。
 * @param {{store:import('./store.js').Store}} ctx
 */
export function maybeStartOnboarding({ store }) {
    if (hasOnboarded()) return;
    if (!store.isEmpty()) { markOnboarded(); return; } // 既存ユーザーは対象外
    setTimeout(() => startTour(buildSteps(store), { onFinish: endCleanup }), 400);
}

/**
 * ヘルプから再生。必要ならレシピモジュールへ切り替えてから開始。
 * @param {{store:import('./store.js').Store, toRecipe?:Function}} ctx
 */
export function replayOnboarding({ store, toRecipe } = {}) {
    if (toRecipe) toRecipe();
    setTimeout(() => startTour(buildSteps(store), { onFinish: endCleanup }), 150);
}
