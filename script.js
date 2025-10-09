// グローバル変数
let recipeDB;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    try {
        // RecipeDatabaseを初期化
        recipeDB = new RecipeDatabase();
        console.log('RecipeDatabase initialized');
        
        // LocalStorageからデータを読み込み
        loadFromLocalStorage();
        console.log('Data loaded from localStorage, total recipes:', recipeDB.getAllRecipes().length);
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // UIを初期化
        updateAllUI();
        console.log('UI updated with recipes:', recipeDB.getAllRecipes().map(r => r.name));
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification(`初期化エラー: ${error.message}`, 'error');
    }
});

// イベントリスナーの設定
function setupEventListeners() {
    // ボタンのイベントリスナー
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const welcomeImportBtn = document.getElementById('welcomeImportBtn');
    const backupBtn = document.getElementById('backupBtn');
    const recipeManagerBtn = document.getElementById('recipeManagerBtn');
    
    if (exportBtn) exportBtn.addEventListener('click', exportToFile);
    if (importBtn) importBtn.addEventListener('click', importFromFile);
    if (welcomeImportBtn) welcomeImportBtn.addEventListener('click', importFromFile);
    if (backupBtn) backupBtn.addEventListener('click', createBackup);
    if (recipeManagerBtn) recipeManagerBtn.addEventListener('click', showRecipeManager);
    
    // ウィンドウリサイズ時の処理（現在は不要）
    // 折りたたみ機能はリサイズに影響されない
}

// 材料計算機能
function calculateMaterials() {
    try {
        const quantityInput = document.getElementById('quantity');
        const resultDiv = document.getElementById('calculationResult');
        
        if (!quantityInput || !resultDiv) {
            showNotification('計算に必要な要素が見つかりません', 'error');
            return;
        }
        
        const recipeName = getSelectValue('selectedRecipe');
        const quantity = parseInt(quantityInput.value);
        
        if (!recipeName) {
            showNotification('レシピを選択してください', 'error');
            return;
        }
        
        if (!quantity || quantity <= 0) {
            showNotification('正しい個数を入力してください', 'error');
            return;
        }
        
        const recipe = recipeDB.getRecipe(recipeName);
        if (!recipe) {
            showNotification('選択されたレシピが見つかりません', 'error');
            return;
        }
        
        // 基本材料まで展開して計算
        const expandedIngredients = recipeDB.expandIngredients(recipeName, quantity);
        
        // 結果を表示
        displayCalculationResult(recipeName, quantity, expandedIngredients);
        
        showNotification(`「${recipeName}」${quantity}個分の材料を計算しました`, 'success');
        
    } catch (error) {
        console.error('Error in calculateMaterials:', error);
        showNotification(`計算エラー: ${error.message}`, 'error');
    }
}

// 計算結果を表示
function displayCalculationResult(recipeName, quantity, expandedIngredients) {
    const resultDiv = document.getElementById('calculationResult');
    
    let html = `
        <div class="calculation-header">
            <h3><i class="fas fa-calculator"></i> 計算結果</h3>
            <p><strong>${recipeName}</strong> を <strong>${quantity}個</strong> 作るのに必要な材料:</p>
        </div>
        <div class="materials-grid">
    `;
    
    // 材料をソートして表示
    const sortedIngredients = Object.entries(expandedIngredients).sort(([a], [b]) => a.localeCompare(b));
    
    sortedIngredients.forEach(([ingredient, amount]) => {
        const ingredientData = recipeDB.getRecipe(ingredient);
        const icon = ingredientData?.icon || 'fa-utensils';
        
        html += `
            <div class="material-item">
                <div class="material-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="material-info">
                    <span class="material-name">${ingredient}</span>
                    <span class="material-amount">${amount}</span>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="calculation-summary">
            <p><i class="fas fa-info-circle"></i> 合計 <strong>${sortedIngredients.length}種類</strong> の基本材料が必要です</p>
        </div>
    `;
    
    resultDiv.innerHTML = html;
}











