// dom.js — 安全な DOM 生成ヘルパー
//
// innerHTML への文字列連結を排し、テキストは textContent で入れることで
// XSS を根絶する。アイコン等の構造化要素は el() で組み立てる。

/**
 * 要素を生成する。
 * @param {string} tag                  タグ名（例 'div', 'button'）
 * @param {object} [props]              属性・プロパティ。class/dataset/on* に対応
 * @param {(Node|string|null|Array)} [children] 子要素（文字列は textNode 化）
 * @returns {HTMLElement}
 *
 * 例: el('button', { class: 'btn', onclick: fn, dataset: { id: '3' } }, [icon, ' 保存'])
 */
export function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(props || {})) {
        if (value == null || value === false) continue;
        if (key === 'class' || key === 'className') {
            node.className = value;
        } else if (key === 'dataset') {
            for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(node.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'html') {
            // 明示的に信頼できる静的 HTML のみ（アイコン用など）。外部入力には使わない。
            node.innerHTML = value;
        } else if (key in node && key !== 'list') {
            try { node[key] = value; } catch { node.setAttribute(key, value); }
        } else {
            node.setAttribute(key, value);
        }
    }

    appendChildren(node, children);
    return node;
}

function appendChildren(node, children) {
    const list = Array.isArray(children) ? children : [children];
    for (const child of list) {
        if (child == null || child === false) continue;
        node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
}

/** Font Awesome アイコン要素を作る */
export function icon(faClass, extra = '') {
    const cls = faClass && faClass.startsWith('fa-') ? `fas ${faClass}` : (faClass || 'fas fa-utensils');
    return el('i', { class: `${cls} ${extra}`.trim(), 'aria-hidden': 'true' });
}

/** 子要素をすべて取り除く */
export function clear(node) {
    if (node) node.replaceChildren();
}

/** HTML エスケープ（テンプレート文字列でどうしても必要な箇所用） */
export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
