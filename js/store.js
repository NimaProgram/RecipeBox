// store.js — 中央状態ストア（レシピ・在庫）と pub/sub
//
// 状態を単一の場所に集約し、変更時に購読者へ通知する。
// UI は subscribe() で再描画をフックし、mutation メソッドのみで状態を変える。

import { migrate, buildExport, DEFAULT_ICON } from './schema.js';
import { expandIngredients, getDependencies, getDependents, wouldCreateCycle } from './recipe-logic.js';

export class Store {
    constructor() {
        /** @type {Map<string, object>} 基本材料・レシピを名前キーで保持 */
        this.recipes = new Map();
        /** @type {Map<string, number>} */
        this.inventory = new Map();
        this._subscribers = new Set();
    }

    // --- 購読 -------------------------------------------------------------
    subscribe(fn) {
        this._subscribers.add(fn);
        return () => this._subscribers.delete(fn);
    }

    /** 変更を全購読者へ通知する */
    emit() {
        for (const fn of this._subscribers) {
            try { fn(this); } catch (err) { console.error('subscriber error:', err); }
        }
    }

    // --- 読み取り ---------------------------------------------------------
    getRecipe(name) { return this.recipes.get(name); }
    hasRecipe(name) { return this.recipes.has(name); }
    getAllRecipes() { return Array.from(this.recipes.values()); }

    /** 材料を持つ（計算対象になり得る）レシピ一覧 */
    getRecipesWithIngredients() {
        return this.getAllRecipes().filter(
            r => r.type === 'recipe' && r.ingredients && Object.keys(r.ingredients).length > 0
        );
    }

    getBasicItems() {
        return this.getAllRecipes().filter(r => r.type === 'basic');
    }

    getInventory(name) { return this.inventory.get(name) || 0; }

    isEmpty() { return this.recipes.size === 0 && this.inventory.size === 0; }

    getStats() {
        const recipes = this.getAllRecipes();
        return {
            recipes: recipes.filter(r => r.type === 'recipe').length,
            basicItems: recipes.filter(r => r.type === 'basic').length,
            total: this.recipes.size,
        };
    }

    // --- 計算（ロジックへ委譲） -------------------------------------------
    expand(name, quantity = 1) { return expandIngredients(this.recipes, name, quantity); }
    dependents(name) { return getDependents(this.recipes, name); }
    wouldCycle(recipeName, ingredient) { return wouldCreateCycle(this.recipes, recipeName, ingredient); }

    // --- 変更（mutation） -------------------------------------------------

    /**
     * レシピ or 基本材料を追加・更新する。材料の有無で type を決定。
     * @param {{name:string, baseQuantity?:number, ingredients?:object, icon?:string, description?:string, category?:string}} data
     */
    upsertRecipe(data, { silent = false } = {}) {
        const name = String(data.name || '').trim();
        if (!name) throw new Error('レシピ名が空です');

        const ingredients = {};
        if (data.ingredients) {
            for (const [ing, amount] of Object.entries(data.ingredients)) {
                const qty = Math.max(1, Math.floor(Number(amount) || 0));
                if (ing && qty > 0) ingredients[ing] = qty;
            }
        }
        const type = Object.keys(ingredients).length === 0 ? 'basic' : 'recipe';

        this.recipes.set(name, {
            name,
            type,
            baseQuantity: Math.max(1, Math.floor(Number(data.baseQuantity) || 1)),
            ingredients,
            icon: data.icon || DEFAULT_ICON,
            description: typeof data.description === 'string' ? data.description : '',
            category: data.category || 'default',
        });

        if (!silent) this.emit();
    }

    /**
     * 改名カスケード: ノード名を変更し、全レシピの材料参照と在庫キーも移設する。
     * @returns {boolean} 成功なら true
     */
    renameNode(oldName, newName) {
        oldName = String(oldName);
        newName = String(newName || '').trim();
        if (!newName || oldName === newName) return false;
        if (!this.recipes.has(oldName)) return false;
        if (this.recipes.has(newName)) {
            throw new Error(`「${newName}」は既に存在します`);
        }

        // ノード本体を付け替え
        const node = this.recipes.get(oldName);
        node.name = newName;
        this.recipes.delete(oldName);
        this.recipes.set(newName, node);

        // 全レシピの材料参照を移設
        for (const recipe of this.recipes.values()) {
            if (recipe.ingredients && Object.prototype.hasOwnProperty.call(recipe.ingredients, oldName)) {
                recipe.ingredients[newName] = recipe.ingredients[oldName];
                delete recipe.ingredients[oldName];
            }
        }

        // 在庫キーを移設
        if (this.inventory.has(oldName)) {
            this.inventory.set(newName, this.inventory.get(oldName));
            this.inventory.delete(oldName);
        }

        this.emit();
        return true;
    }

    deleteNode(name) {
        const existed = this.recipes.delete(name);
        this.inventory.delete(name);
        if (existed) this.emit();
        return existed;
    }

    /** レシピを複製する（材料はそのまま参照を引き継ぐ） */
    duplicateRecipe(sourceName, newName) {
        const src = this.recipes.get(sourceName);
        if (!src) throw new Error('複製元が見つかりません');
        newName = String(newName || '').trim();
        if (!newName) throw new Error('新しい名前を入力してください');
        if (this.recipes.has(newName)) throw new Error('同名のレシピが既に存在します');

        this.recipes.set(newName, {
            ...src,
            name: newName,
            ingredients: { ...src.ingredients },
            description: `${src.description || ''} (コピー)`.trim(),
        });
        this.emit();
    }

    setInventory(name, quantity, { silent = false } = {}) {
        const qty = Math.max(0, Math.floor(Number(quantity) || 0));
        if (qty === 0) this.inventory.delete(name);
        else this.inventory.set(name, qty);
        if (!silent) this.emit();
    }

    // --- シリアライズ -----------------------------------------------------

    /** 現行スキーマのプレーンオブジェクトを返す */
    toJSON() {
        return buildExport(
            Object.fromEntries(this.recipes),
            Object.fromEntries(this.inventory)
        );
    }

    /** 任意入力（v1/v2）を取り込み、状態を置き換える */
    load(input) {
        const data = migrate(input);
        this.recipes = new Map(Object.entries(data.recipes));
        this.inventory = new Map(Object.entries(data.inventory));
        this.emit();
    }

    clear() {
        this.recipes = new Map();
        this.inventory = new Map();
        this.emit();
    }

    /** 展開結果の依存ツリー用: 依存名リスト */
    dependencies(name) { return getDependencies(this.recipes, name); }
}
