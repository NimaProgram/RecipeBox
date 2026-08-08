// dialogs.js — モーダル基盤・確認/入力ダイアログ・トースト通知
//
// 旧実装の prompt()/alert()/confirm() を全廃し、アプリ内 UI に統一する。

import { el, icon, clear } from './dom.js';

let toastHost = null;

function ensureToastHost() {
    if (!toastHost) {
        toastHost = el('div', { class: 'toast-host', 'aria-live': 'polite', 'aria-atomic': 'false' });
        document.body.appendChild(toastHost);
    }
    return toastHost;
}

const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
};

/** トースト通知を表示する */
export function notify(message, type = 'info') {
    const host = ensureToastHost();
    const toast = el('div', { class: `toast toast-${type}`, role: 'status' }, [
        icon(TOAST_ICONS[type] || TOAST_ICONS.info, 'toast-icon'),
        el('span', { class: 'toast-msg' }, message),
    ]);
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const remove = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        setTimeout(() => toast.remove(), 400); // フォールバック
    };
    setTimeout(remove, 3200);
    toast.addEventListener('click', remove);
}

// --- 汎用モーダル ---------------------------------------------------------

let openCount = 0;

/**
 * モーダルを開く。
 * @param {object} opts
 * @param {string} opts.title
 * @param {Node|Node[]} opts.body                本文要素
 * @param {Array<{label:string, variant?:string, onClick?:Function, closeOnClick?:boolean, autofocus?:boolean}>} [opts.actions]
 * @param {string} [opts.size]  '', 'wide', 'narrow'
 * @param {Function} [opts.onClose]
 * @returns {{root:HTMLElement, close:Function, setActionsDisabled:Function}}
 */
export function openModal({ title, body, actions = [], size = '', onClose } = {}) {
    const footerButtons = [];

    const close = (result) => {
        content.classList.add('closing');
        overlay.classList.add('closing');
        const finish = () => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
            openCount = Math.max(0, openCount - 1);
            if (openCount === 0) document.body.classList.remove('modal-open');
            if (onClose) onClose(result);
        };
        content.addEventListener('animationend', finish, { once: true });
        setTimeout(finish, 260); // フォールバック
    };

    const onKey = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); close(); }
    };

    const header = el('div', { class: 'modal-header' }, [
        el('h3', { class: 'modal-title' }, title || ''),
        el('button', {
            class: 'modal-close', type: 'button', 'aria-label': '閉じる',
            onclick: () => close(),
        }, [icon('fa-xmark')]),
    ]);

    const bodyEl = el('div', { class: 'modal-body' }, Array.isArray(body) ? body : [body]);

    const footer = el('div', { class: 'modal-footer' });
    actions.forEach((a) => {
        const btn = el('button', {
            type: 'button',
            class: `btn btn-${a.variant || 'ghost'}`,
            onclick: () => {
                const keepOpen = a.onClick && a.onClick() === false;
                if (a.closeOnClick !== false && !keepOpen) close(a.value);
            },
        }, a.label);
        if (a.autofocus) btn.dataset.autofocus = 'true';
        footerButtons.push(btn);
        footer.appendChild(btn);
    });

    const content = el('div', { class: `modal-content ${size}`.trim(), role: 'dialog', 'aria-modal': 'true' },
        actions.length ? [header, bodyEl, footer] : [header, bodyEl]);

    const overlay = el('div', {
        class: 'modal-overlay',
        onclick: (e) => { if (e.target === overlay) close(); },
    }, [content]);

    document.body.appendChild(overlay);
    openCount += 1;
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);

    // フォーカス設定
    requestAnimationFrame(() => {
        const target = content.querySelector('[data-autofocus="true"], input, select, textarea, button.btn');
        if (target) target.focus();
    });

    return {
        root: content,
        close,
        setActionsDisabled: (disabled) => footerButtons.forEach(b => { b.disabled = disabled; }),
    };
}

/**
 * 確認ダイアログ。
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title = '確認', message, detail, confirmLabel = 'OK', cancelLabel = 'キャンセル', danger = false } = {}) {
    return new Promise((resolve) => {
        const body = [el('p', { class: 'dialog-message' }, message)];
        if (detail) body.push(el('div', { class: 'dialog-detail' }, detail));

        openModal({
            title,
            size: 'narrow',
            body,
            onClose: (result) => resolve(result === true),
            actions: [
                { label: cancelLabel, variant: 'ghost', value: false },
                { label: confirmLabel, variant: danger ? 'danger' : 'primary', value: true, autofocus: true },
            ],
        });
    });
}

/**
 * 入力ダイアログ。
 * @returns {Promise<string|null>} 入力値。キャンセル時 null
 */
export function promptDialog({ title = '入力', label, value = '', placeholder = '', confirmLabel = 'OK', cancelLabel = 'キャンセル', validate } = {}) {
    return new Promise((resolve) => {
        let resolved = false;
        const settle = (v) => { if (!resolved) { resolved = true; resolve(v); } };

        const errorEl = el('small', { class: 'form-error', role: 'alert' });
        const input = el('input', {
            type: 'text', class: 'form-input', value, placeholder, 'data-autofocus': 'true',
        });

        // 検証を通れば settle(value) して true を返す（呼び出し側で close する）
        const tryAccept = () => {
            const v = input.value.trim();
            if (validate) {
                const err = validate(v);
                if (err) { errorEl.textContent = err; input.focus(); return false; }
            }
            settle(v);
            return true;
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (tryAccept()) modal.close(); }
        });

        const body = [el('div', { class: 'form-group' }, [
            label ? el('label', { class: 'form-label' }, label) : null,
            input,
            errorEl,
        ].filter(Boolean))];

        const modal = openModal({
            title,
            size: 'narrow',
            body,
            onClose: () => settle(null), // 検証成功時は既に settle 済みなので無視される
            actions: [
                { label: cancelLabel, variant: 'ghost' }, // close → onClose → settle(null)
                { label: confirmLabel, variant: 'primary', onClick: () => tryAccept() === false }, // false 検証時はモーダルを開いたまま
            ],
        });
    });
}
