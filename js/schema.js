// schema.js — 保存データのスキーマ定義とマイグレーション（下位互換）
//
// v1 (旧形式): { recipes: {..}, inventory: {..} }  ※ schemaVersion なし
// v2         : { schemaVersion: 2, app, exportedAt, recipes: {..}, inventory: {..} }
// v3 (現行)  : v2 + categories: [{ icon, label }]（アイコン=カテゴリの編集可能カタログ）
//
// recipes/inventory は「名前キー」を維持しているため、旧版→現行は
// ラップ + 既定値補完 + サニタイズ + categories の種まきで完結する。

import { DEFAULT_CATEGORIES, DEFAULT_ICON, normalizeIconClass } from './icons.js';

export const CURRENT_SCHEMA = 3;
export const APP_ID = 'RecipeBox';

/** レシピノード1件を正規化する（欠損フィールドを補完） */
function normalizeNode(name, raw) {
    const node = raw && typeof raw === 'object' ? raw : {};
    const ingredients = {};

    if (node.ingredients && typeof node.ingredients === 'object') {
        for (const [ingName, amount] of Object.entries(node.ingredients)) {
            const qty = Math.max(1, Math.floor(Number(amount) || 0));
            if (ingName && qty > 0) ingredients[String(ingName)] = qty;
        }
    }

    const hasIngredients = Object.keys(ingredients).length > 0;
    // type が未指定・不正なら材料の有無から推定
    let type = node.type === 'basic' || node.type === 'recipe' ? node.type : null;
    if (!type) type = hasIngredients ? 'recipe' : 'basic';

    return {
        name: String(node.name || name),
        type,
        baseQuantity: Math.max(1, Math.floor(Number(node.baseQuantity) || 1)),
        ingredients,
        icon: normalizeIconClass(node.icon) || DEFAULT_ICON,
        description: typeof node.description === 'string' ? node.description : '',
        category: typeof node.category === 'string' && node.category ? node.category : 'default',
    };
}

/** recipes マップ全体を正規化する */
function normalizeRecipes(rawRecipes) {
    const recipes = {};
    if (rawRecipes && typeof rawRecipes === 'object') {
        for (const [name, node] of Object.entries(rawRecipes)) {
            if (!name) continue;
            recipes[name] = normalizeNode(name, node);
        }
    }
    return recipes;
}

/**
 * categories を正規化し、既存ノードで使われている未収録グリフも補う。
 * @param {any} rawCategories 入力の categories（無い場合あり）
 * @param {object} recipes    正規化済み recipes（使用グリフ収集用）
 * @returns {{icon:string,label:string}[]}
 */
function normalizeCategories(rawCategories, recipes) {
    const out = [];
    const seen = new Set();
    const add = (icon, label) => {
        const c = normalizeIconClass(icon);
        if (!c || seen.has(c)) return;
        seen.add(c);
        out.push({ icon: c, label: typeof label === 'string' && label.trim() ? label.trim() : c });
    };

    // カタログ入力があれば（v3）それを厳密に採用（ユーザーの削除も尊重）。
    if (Array.isArray(rawCategories) && rawCategories.length) {
        for (const cat of rawCategories) {
            if (cat && typeof cat === 'object') add(cat.icon, cat.label);
        }
        return out;
    }

    // 旧データ（v1/v2: categories 無し）: 既定を種にし、使用中グリフも収集して孤立を防ぐ。
    for (const cat of DEFAULT_CATEGORIES) add(cat.icon, cat.label);
    for (const node of Object.values(recipes || {})) {
        if (node && node.icon && !seen.has(node.icon)) add(node.icon, node.icon);
    }
    return out;
}

/** inventory マップを正規化する（非負整数へ） */
function normalizeInventory(rawInventory) {
    const inventory = {};
    if (rawInventory && typeof rawInventory === 'object') {
        for (const [name, amount] of Object.entries(rawInventory)) {
            if (!name) continue;
            const qty = Math.max(0, Math.floor(Number(amount) || 0));
            if (qty > 0) inventory[name] = qty;
        }
    }
    return inventory;
}

/**
 * 任意の入力（文字列 or オブジェクト、v1 or v2）を現行スキーマへ変換する。
 * @param {string|object} input
 * @returns {{schemaVersion:number, app:string, recipes:object, inventory:object}}
 */
export function migrate(input) {
    let data = input;
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }
    if (!data || typeof data !== 'object') {
        throw new Error('無効なデータ形式です');
    }

    // recipes / inventory のいずれも無い場合は不正
    if (!('recipes' in data) && !('inventory' in data)) {
        throw new Error('レシピデータが見つかりません');
    }

    // v1/v2: categories 欠如 → 種まき。v3: そのまま正規化。
    const recipes = normalizeRecipes(data.recipes);
    return {
        schemaVersion: CURRENT_SCHEMA,
        app: APP_ID,
        recipes,
        inventory: normalizeInventory(data.inventory),
        categories: normalizeCategories(data.categories, recipes),
    };
}

/** 現行スキーマのエクスポート用オブジェクトを組み立てる */
export function buildExport(recipes, inventory, categories) {
    return {
        schemaVersion: CURRENT_SCHEMA,
        app: APP_ID,
        exportedAt: new Date().toISOString(),
        recipes,
        inventory,
        categories: Array.isArray(categories) ? categories : [],
    };
}

export { DEFAULT_ICON };
