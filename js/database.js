// データベースクラス定義
class RecipeDatabase {
    constructor() {
        this.recipes = new Map();
        this.inventory = new Map();
        this.initializeDefaultData();
    }

    // デフォルトデータの初期化（空の状態から開始）
    initializeDefaultData() {
        // 空の状態から開始
        // ユーザーが独自のレシピを追加していく
        console.log('Recipe database initialized - ready for user recipes');
    }

    // アイテム（基本材料）を追加
    addItem(name, properties) {
        this.recipes.set(name, {
            name: name,
            type: "basic",
            icon: properties.icon || "fa-utensils",
            description: properties.description || `基本材料: ${name}`
        });
    }

    // レシピを追加
    addRecipe(name, recipe) {
        const ingredients = recipe.ingredients || {};
        const recipeType = Object.keys(ingredients).length === 0 ? "basic" : "recipe";
        
        this.recipes.set(name, {
            name: recipe.name || name,
            type: recipeType,
            baseQuantity: recipe.baseQuantity || 1,
            ingredients: ingredients,
            icon: recipe.icon || "fa-utensils",
            description: recipe.description || "",
            category: recipe.category || "default"
        });
    }

    // レシピを削除
    deleteRecipe(name) {
        this.recipes.delete(name);
    }

    // 在庫設定
    setInventory(item, quantity) {
        this.inventory.set(item, Math.max(0, quantity));
    }

    // 在庫取得
    getInventory(item) {
        return this.inventory.get(item) || 0;
    }



    // レシピ取得
    getRecipe(name) {
        return this.recipes.get(name);
    }

    // 全レシピ取得
    getAllRecipes() {
        return Array.from(this.recipes.values());
    }

    // レシピ一覧取得（材料を持つもの）
    getRecipesWithIngredients() {
        return Array.from(this.recipes.values()).filter(recipe => 
            recipe.type === "recipe" && 
            recipe.ingredients && 
            Object.keys(recipe.ingredients).length > 0
        );
    }

    // 基本材料一覧取得
    getBasicItems() {
        return Array.from(this.recipes.values()).filter(recipe => recipe.type === "basic");
    }

    // 再帰的材料展開
    expandIngredients(recipeName, quantity = 1, visited = new Set()) {
        // 循環参照チェック
        if (visited.has(recipeName)) {
            console.warn(`循環参照を検出: ${recipeName}`);
            return {};
        }

        const recipe = this.getRecipe(recipeName);
        if (!recipe || recipe.type === "basic") {
            // 基本材料の場合
            return { [recipeName]: quantity };
        }

        visited.add(recipeName);
        const result = {};
        const ratio = quantity / (recipe.baseQuantity || 1);

        for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
            const neededAmount = Math.ceil(amount * ratio);
            const expanded = this.expandIngredients(ingredient, neededAmount, new Set(visited));
            
            for (const [basicItem, basicAmount] of Object.entries(expanded)) {
                result[basicItem] = (result[basicItem] || 0) + basicAmount;
            }
        }

        visited.delete(recipeName);
        return result;
    }

    // レシピの依存関係取得
    getDependencies(recipeName) {
        const recipe = this.getRecipe(recipeName);
        if (!recipe || recipe.type === "basic") {
            return [];
        }

        const dependencies = [];
        for (const ingredient of Object.keys(recipe.ingredients)) {
            dependencies.push(ingredient);
            dependencies.push(...this.getDependencies(ingredient));
        }

        return [...new Set(dependencies)];
    }

    // データベースをJSONに変換
    toJSON() {
        return {
            recipes: Object.fromEntries(this.recipes),
            inventory: Object.fromEntries(this.inventory)
        };
    }

    // JSONからデータベースを復元
    fromJSON(data) {
        try {
            // 文字列の場合はパースする
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (parsedData.recipes) {
                this.recipes = new Map(Object.entries(parsedData.recipes));
            }
            if (parsedData.inventory) {
                this.inventory = new Map(Object.entries(parsedData.inventory));
            }
        } catch (error) {
            console.error('Error parsing JSON data:', error);
            throw new Error('無効なデータ形式です');
        }
    }

    // データベースの状態を判定する
    isEmpty() {
        const recipeCount = this.recipes.size;
        const inventoryCount = this.inventory.size;
        return recipeCount === 0 && inventoryCount === 0;
    }

    // 登録されているデータ数を取得
    getDataCounts() {
        return {
            recipes: this.recipes.size,
            inventory: this.inventory.size,
            total: this.recipes.size + this.inventory.size
        };
    }
}

