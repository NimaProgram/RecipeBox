// schema.js — 保存データのスキーマ定義とマイグレーション（下位互換）
//
// v1 (旧形式): { recipes: {..}, inventory: {..} }  ※ schemaVersion なし
// v2 (現行)  : { schemaVersion: 2, app, exportedAt, recipes: {..}, inventory: {..} }
//
// recipes/inventory は「名前キー」を維持しているため、v1→v2 は
// ラップ + 既定値補完 + サニタイズで完結する。

export const CURRENT_SCHEMA = 2;
export const APP_ID = 'RecipeBox';

const DEFAULT_ICON = 'fa-utensils';

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
        icon: typeof node.icon === 'string' && node.icon ? node.icon : DEFAULT_ICON,
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

    // v1: schemaVersion 欠如 → そのまま正規化してラップ
    // v2: 正規化のみ
    return {
        schemaVersion: CURRENT_SCHEMA,
        app: APP_ID,
        recipes: normalizeRecipes(data.recipes),
        inventory: normalizeInventory(data.inventory),
    };
}

/** 現行スキーマのエクスポート用オブジェクトを組み立てる */
export function buildExport(recipes, inventory) {
    return {
        schemaVersion: CURRENT_SCHEMA,
        app: APP_ID,
        exportedAt: new Date().toISOString(),
        recipes,
        inventory,
    };
}

export { DEFAULT_ICON };
