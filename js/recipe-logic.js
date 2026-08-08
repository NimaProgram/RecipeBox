// recipe-logic.js — 材料展開・依存解決の純粋関数群
//
// recipes: Map<string, Node> を受け取り、副作用なしで計算する。
// Node = { name, type:'basic'|'recipe', baseQuantity, ingredients:{name:qty}, icon, ... }

/**
 * レシピを基本材料まで再帰展開し、必要量を集計する。
 * 各段で Math.ceil による切り上げを行う（旧挙動を維持）。
 * @param {Map<string,object>} recipes
 * @param {string} recipeName
 * @param {number} quantity
 * @param {Set<string>} [visited] 循環参照検出用
 * @returns {Object<string, number>} 基本材料名 → 必要量
 */
export function expandIngredients(recipes, recipeName, quantity = 1, visited = new Set()) {
    if (visited.has(recipeName)) {
        console.warn(`循環参照を検出: ${recipeName}`);
        return {};
    }

    const recipe = recipes.get(recipeName);
    if (!recipe || recipe.type === 'basic' || !recipe.ingredients ||
        Object.keys(recipe.ingredients).length === 0) {
        return { [recipeName]: quantity };
    }

    visited.add(recipeName);
    const result = {};
    const ratio = quantity / (recipe.baseQuantity || 1);

    for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
        const needed = Math.ceil(amount * ratio);
        const expanded = expandIngredients(recipes, ingredient, needed, new Set(visited));
        for (const [item, qty] of Object.entries(expanded)) {
            result[item] = (result[item] || 0) + qty;
        }
    }

    visited.delete(recipeName);
    return result;
}

/**
 * レシピが（間接含め）依存する全ノード名を返す。
 * @returns {string[]}
 */
export function getDependencies(recipes, recipeName, visited = new Set()) {
    const recipe = recipes.get(recipeName);
    if (!recipe || recipe.type === 'basic' || visited.has(recipeName)) return [];

    visited.add(recipeName);
    const deps = [];
    for (const ingredient of Object.keys(recipe.ingredients || {})) {
        deps.push(ingredient);
        deps.push(...getDependencies(recipes, ingredient, visited));
    }
    return [...new Set(deps)];
}

/**
 * 指定ノードを材料として直接参照しているレシピ名の一覧（削除警告用）。
 * @returns {string[]}
 */
export function getDependents(recipes, targetName) {
    const dependents = [];
    for (const recipe of recipes.values()) {
        if (recipe.ingredients && recipe.ingredients[targetName]) {
            dependents.push(recipe.name);
        }
    }
    return dependents;
}

/**
 * newName を recipeName の材料に加えると循環参照になるか判定する。
 * （レシピフォームでの自己参照・相互参照チェック用）
 */
export function wouldCreateCycle(recipes, recipeName, candidateIngredient) {
    if (recipeName === candidateIngredient) return true;
    // candidateIngredient の依存に recipeName が含まれるなら循環
    return getDependencies(recipes, candidateIngredient).includes(recipeName);
}
