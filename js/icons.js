// icons.js — カテゴリ（アイコン）の既定値・パレット・ユーティリティ
//
// カテゴリ = { icon: 'fa-*'(グリフ), label: 表示名 }。icon をキーとして扱う。

export const DEFAULT_ICON = 'fa-utensils';

/** 初回/未収録時に使う既定カテゴリ（旧 ICON_OPTIONS 相当） */
export const DEFAULT_CATEGORIES = [
    { icon: 'fa-utensils', label: '基本 / 料理' },
    { icon: 'fa-bowl-food', label: '料理（丼）' },
    { icon: 'fa-egg', label: '卵' },
    { icon: 'fa-glass-water', label: '液体 / 水' },
    { icon: 'fa-bread-slice', label: 'パン / 生地' },
    { icon: 'fa-cheese', label: 'チーズ' },
    { icon: 'fa-ice-cream', label: 'クリーム' },
    { icon: 'fa-salt-shaker', label: '調味料' },
    { icon: 'fa-cube', label: '粉 / 固形' },
    { icon: 'fa-fish', label: '魚' },
    { icon: 'fa-drumstick-bite', label: '肉' },
    { icon: 'fa-carrot', label: '野菜' },
    { icon: 'fa-apple-whole', label: '果物' },
    { icon: 'fa-wheat-awn', label: '穀物' },
    { icon: 'fa-flask', label: '薬品 / 錬金' },
    { icon: 'fa-fire', label: '加工 / 調理' },
    { icon: 'fa-gem', label: '宝石 / 貴重品' },
    { icon: 'fa-box', label: '交易品 / その他' },
];

/** グリフ選択パレット（自己ホスト fa-solid に含まれる無料 solid アイコン） */
export const ICON_PALETTE = [
    'fa-utensils', 'fa-bowl-food', 'fa-bowl-rice', 'fa-plate-wheat', 'fa-egg',
    'fa-bacon', 'fa-bread-slice', 'fa-cheese', 'fa-drumstick-bite', 'fa-bone',
    'fa-fish', 'fa-shrimp', 'fa-carrot', 'fa-pepper-hot', 'fa-lemon',
    'fa-apple-whole', 'fa-wheat-awn', 'fa-seedling', 'fa-leaf', 'fa-mug-hot',
    'fa-mug-saucer', 'fa-wine-bottle', 'fa-wine-glass', 'fa-beer-mug-empty',
    'fa-glass-water', 'fa-bottle-water', 'fa-ice-cream', 'fa-cookie',
    'fa-cake-candles', 'fa-pizza-slice', 'fa-burger', 'fa-hotdog', 'fa-jar',
    'fa-flask', 'fa-vial', 'fa-mortar-pestle', 'fa-salt-shaker', 'fa-cube',
    'fa-cubes', 'fa-box', 'fa-boxes-stacked', 'fa-gem', 'fa-ring', 'fa-crown',
    'fa-coins', 'fa-gift', 'fa-fire', 'fa-fire-flame-curved', 'fa-bolt',
    'fa-hat-wizard', 'fa-dragon', 'fa-shield-halved', 'fa-scroll', 'fa-hammer',
    'fa-screwdriver-wrench', 'fa-gears', 'fa-feather', 'fa-wand-sparkles',
    'fa-star', 'fa-heart', 'fa-tag', 'fa-cart-shopping', 'fa-tree',
    'fa-droplet', 'fa-water',
];

/**
 * 任意入力から Font Awesome の `fa-*` クラス（グリフ名）を抽出・正規化する。
 * "fas fa-egg" / "fa-egg" / "FA-Egg" → "fa-egg"。抽出できなければ ''。
 */
export function normalizeIconClass(input) {
    if (typeof input !== 'string') return '';
    const m = input.match(/fa-[a-z0-9-]+/i);
    return m ? m[0].toLowerCase() : '';
}

/** 有効な `fa-*` クラス形式かどうか */
export function isValidIcon(input) {
    return !!normalizeIconClass(input);
}

/** 既定カテゴリのディープコピーを返す（ストア初期化用） */
export function seedCategories() {
    return DEFAULT_CATEGORIES.map(c => ({ icon: c.icon, label: c.label }));
}
