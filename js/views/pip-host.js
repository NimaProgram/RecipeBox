// views/pip-host.js — Document Picture-in-Picture の汎用ホスト
//
// フルスクリーンのゲーム上に常時最前面で任意 HTML を出せる唯一の手段が
// Document Picture-in-Picture API（Chromium 116+）。同時に開けるのは1つ。
// レシピ/ボスなど各モジュールがこのホストを共有し、単一ウィンドウを扱う。
//
// 注意: PiP ドキュメント内の要素は opener の JS から操作する。document/window
// レベルのリスナー（＝opener を参照）を使う部品（combobox 等）は避け、
// ネイティブ要素と要素レベルのリスナーで構成すること。

import { notify } from '../dialogs.js';

let current = null; // { win, dispose }

export function isPipSupported() {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

/** 同一オリジンの stylesheet を絶対URLで複製し、テーマを同期（第三者・インライン無し） */
function copyStyles(win) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const l = win.document.createElement('link');
        l.rel = 'stylesheet';
        l.href = link.href; // 絶対URL（PiP の base 差異を回避）
        win.document.head.appendChild(l);
    });
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) win.document.head.appendChild(csp.cloneNode(true));
    win.document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
}

/**
 * PiP ウィンドウを開く（未対応時はトースト）。既存があれば置き換える（1ウィンドウ制約）。
 * ※ requestWindow はユーザー操作直下（クリックハンドラ内）で呼ぶこと。
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @param {(win:Window, container:HTMLElement)=>({dispose?:Function}|void)} opts.mount
 *   内容を container に構築し、任意で { dispose } を返す（interval/購読解除など）。
 * @returns {Promise<Window|null>}
 */
export async function openPipWindow({ title = 'PiP', width = 380, height = 560, mount }) {
    if (!isPipSupported()) {
        notify('お使いのブラウザは PiP に対応していません（Chrome / Edge をご利用ください）', 'warning');
        return null;
    }

    // 既存の PiP を閉じて置き換え
    if (current && current.win && !current.win.closed) {
        try { current.dispose(); } catch { /* noop */ }
        try { current.win.close(); } catch { /* noop */ }
        current = null;
    }

    let win;
    try {
        win = await documentPictureInPicture.requestWindow({ width, height });
    } catch (err) {
        notify(`PiP を開けませんでした: ${err.message}`, 'error');
        return null;
    }

    copyStyles(win);
    win.document.documentElement.lang = 'ja';
    win.document.title = title;
    win.document.body.classList.add('pip');

    const container = win.document.createElement('div');
    container.className = 'pip-root';
    win.document.body.appendChild(container);

    let handle = {};
    try { handle = mount(win, container) || {}; }
    catch (err) { console.error('PiP mount error:', err); }

    const onHide = () => {
        try { handle.dispose && handle.dispose(); } catch { /* noop */ }
        if (current && current.win === win) current = null;
    };
    win.addEventListener('pagehide', onHide);

    current = {
        win,
        dispose: () => { win.removeEventListener('pagehide', onHide); try { handle.dispose && handle.dispose(); } catch { /* noop */ } },
    };
    return win;
}
