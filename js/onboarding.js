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

function buildSteps() {
    return [
        {
            target: null,
            title: 'MMO Toolkit へようこそ',
            body: '最初のレシピを一緒に作ってみましょう（1分ほど）。いつでも「スキップ」や Esc で終了できます。',
            action: 'button', label: '始める',
        },
        {
            target: openCreateTarget,
            title: 'レシピ作成を開く',
            body: 'まずはここをクリックして、レシピ作成フォームを開きます。',
            action: 'click',
        },
        {
            target: '[data-tour="rf-name"]',
            title: 'レシピ名を入力',
            body: '作りたいレシピ／アイテムの名前を入力します（例: チーズパイ）。',
            action: 'input',
        },
        {
            target: '[data-tour="rf-baseqty"]',
            title: '基本作成数',
            body: '1回の作成でできる個数です。通常は 1 のままで大丈夫です。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-icon"]',
            title: 'アイコン（＝カテゴリ）',
            body: 'アイコンはカテゴリとして機能します。材料の分類に使えます。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-ingredients"]',
            title: '材料を追加',
            body: '「材料を追加」で行を増やし、既存の材料/レシピを選ぶか、選択欄の「新しい材料を追加」で新規作成できます。材料なしなら基本材料として登録されます。',
            action: 'button',
        },
        {
            target: '[data-tour="rf-save"]',
            title: '保存',
            body: '入力できたら「保存」でレシピが完成します。クリックしてみましょう。',
            action: 'click',
        },
        {
            target: '[data-tour="calc-select"]',
            title: 'レシピを選択',
            body: '作ったレシピを選ぶと、構成ツリーが表示されます。',
            action: 'button',
        },
        {
            target: '[data-tour="calc-qty"]',
            title: '個数を入力して計算',
            body: '作りたい個数を入れて「計算」すると、必要な基本材料が一覧で表示されます。',
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

/**
 * 初回訪問（未オンボーディング＋レシピ在庫が空）のとき自動起動。
 * @param {{store:import('./store.js').Store}} ctx
 */
export function maybeStartOnboarding({ store }) {
    if (hasOnboarded()) return;
    if (!store.isEmpty()) { markOnboarded(); return; } // 既存ユーザーは対象外
    setTimeout(() => startTour(buildSteps(), { onFinish: markOnboarded }), 400);
}

/**
 * ヘルプから再生。必要ならレシピモジュールへ切り替えてから開始。
 * @param {{toRecipe?:Function}} ctx
 */
export function replayOnboarding({ toRecipe } = {}) {
    if (toRecipe) toRecipe();
    setTimeout(() => startTour(buildSteps(), { onFinish: markOnboarded }), 150);
}
