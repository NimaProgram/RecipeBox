// UI更新関連の関数

// 表示状態を管理
function updateUIVisibility() {
    try {
        const isEmpty = recipeDB.isEmpty();
        const dataCounts = recipeDB.getDataCounts();
        const welcomeSection = document.getElementById('welcomeSection');
        const managementSection = document.querySelector('.recipe-management-section');
        const calculatorSection = document.querySelector('.calculator-section');
        
        console.log(`Database state: isEmpty=${isEmpty}, total=${dataCounts.total}`);
        
        if (isEmpty) {
            // データが空の場合：ウェルカムメッセージを表示
            if (welcomeSection) {
                welcomeSection.style.display = 'block';
                // アニメーションクラスをリセットしてから追加
                setTimeout(() => {
                    welcomeSection.classList.remove('fade-out');
                    welcomeSection.classList.add('fade-in');
                }, 50);
            }
            if (managementSection) {
                managementSection.classList.add('fade-out');
                setTimeout(() => {
                    managementSection.style.display = 'none';
                    managementSection.classList.remove('fade-in', 'fade-out');
                }, 300);
            }
            if (calculatorSection) {
                calculatorSection.classList.add('fade-out');
                setTimeout(() => {
                    calculatorSection.style.display = 'none';
                    calculatorSection.classList.remove('fade-in', 'fade-out');
                }, 300);
            }
        } else {
            // データが存在する場合：メインコンテンツを表示
            if (welcomeSection) {
                welcomeSection.classList.add('fade-out');
                setTimeout(() => {
                    welcomeSection.style.display = 'none';
                    welcomeSection.classList.remove('fade-in', 'fade-out');
                }, 300);
            }
            if (managementSection) {
                managementSection.style.display = 'block';
                setTimeout(() => {
                    managementSection.classList.remove('fade-out');
                    managementSection.classList.add('fade-in');
                }, 50);
            }
            if (calculatorSection) {
                calculatorSection.style.display = 'block';
                setTimeout(() => {
                    calculatorSection.classList.remove('fade-out');
                    calculatorSection.classList.add('fade-in');
                }, 100);
            }
            
            // 統計表示をアニメーション付きで更新
            setTimeout(() => {
                const statItems = document.querySelectorAll('.stat-item');
                statItems.forEach((item, index) => {
                    item.style.animationDelay = `${index * 0.1}s`;
                    item.classList.add('stat-item-animate');
                });
            }, 200);
        }
    } catch (error) {
        console.error('Error in updateUIVisibility:', error);
    }
}

// 全UIを更新
function updateAllUI() {
    try {
        console.log('=== Starting updateAllUI ===');
        console.log('Available recipes:', recipeDB.getAllRecipes().map(r => r.name));
        
        // 表示状態を更新
        updateUIVisibility();
        console.log('UI visibility updated');
        
        updateRecipeStats();
        console.log('Recipe stats updated');
        
        updateRecipeSelector();
        console.log('Recipe selector updated');
        
        // 材料選択ドロップダウンも更新
        if (typeof updateAllIngredientSelects === 'function') {
            updateAllIngredientSelects();
            console.log('Ingredient selects updated');
        }
        
        saveAllToLocalStorage();
        console.log('Data saved to localStorage');
        
        console.log('=== updateAllUI completed ===');
    } catch (error) {
        console.error('Error in updateAllUI:', error);
        showNotification(`UI更新エラー: ${error.message}`, 'error');
    }
}

// レシピセレクターを更新
function updateRecipeSelector() {
    try {
        let currentValue = '';
        
        // カスタムドロップダウンから現在の値を取得
        currentValue = getSelectValue('selectedRecipe');
        
        const recipesWithIngredients = recipeDB.getRecipesWithIngredients();
        
        // カスタムドロップダウンが存在する場合は更新
        console.log('=== updateRecipeSelector: Looking for custom dropdown ===');
        console.log('window.dropdownIntegration exists:', !!window.dropdownIntegration);
        console.log('dropdownIntegration exists:', typeof dropdownIntegration !== 'undefined');
        console.log('recipesWithIngredients:', recipesWithIngredients);
        
        const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
        if (integration) {
            console.log('Integration found, dropdowns count:', integration.dropdowns ? integration.dropdowns.size : 0);
            console.log('Available dropdown keys:', integration.dropdowns ? Array.from(integration.dropdowns.keys()) : []);
            
            const dropdown = integration.getDropdown ? integration.getDropdown('selectedRecipe') : null;
            console.log('selectedRecipe dropdown found:', !!dropdown);
            
            if (dropdown) {
                // オプション配列を作成
                const options = [
                    { value: '', text: 'レシピを選択してください', disabled: true }
                ];
                
                recipesWithIngredients.forEach(recipe => {
                    options.push({
                        value: recipe.name,
                        text: recipe.name,
                        icon: recipe.icon || 'fa-utensils'
                    });
                });
                
                console.log('Setting options for selectedRecipe:', options);
                
                // ドロップダウンのオプションを更新
                dropdown.setOptions(options);
                
                // 以前の選択値を復元
                if (currentValue && recipesWithIngredients.some(r => r.name === currentValue)) {
                    dropdown.setValue(currentValue);
                } else {
                    dropdown.setPlaceholder('レシピを選択してください');
                }
                
                console.log('selectedRecipe dropdown updated successfully');
            } else {
                console.warn('selectedRecipe dropdown not found');
            }
        } else {
            console.warn('No dropdown integration available');
        }
        
    } catch (error) {
        console.error('Error in updateRecipeSelector:', error);
    }
}

// レシピが選択されたときの処理
function onRecipeSelected() {
    try {
        // カスタムドロップダウンから選択されたレシピ名を取得
        const selectedRecipeName = getSelectValue('selectedRecipe');
        
        if (!selectedRecipeName) {
            clearCalculationResult();
            hideRecipeTree();
            return;
        }
        
        const recipe = recipeDB.getRecipe(selectedRecipeName);
        if (!recipe) return;
        
        // 計算結果をクリア
        clearCalculationResult();
        
        // レシピツリーを表示
        buildAndShowRecipeTree(selectedRecipeName);
        
        showNotification(`レシピ「${selectedRecipeName}」を選択しました`, 'success');
    } catch (error) {
        console.error('Error in onRecipeSelected:', error);
        showNotification('レシピ選択エラーが発生しました', 'error');
    }
}

// ===========================================
// レシピツリー表示・構築関連関数
// ===========================================

/**
 * レシピツリーを構築して表示
 * @param {string} recipeName - 表示するレシピ名
 */
function buildAndShowRecipeTree(recipeName) {
    const container = document.getElementById('recipeTreeContainer');
    const treeDiv = document.getElementById('recipeTree');
    const listContainer = document.getElementById('recipeListContainer');
    const listDiv = document.getElementById('recipeList');
    
    if (!container || !treeDiv || !listContainer || !listDiv) {
        console.warn('Recipe tree/list DOM elements not found');
        return;
    }
    
    try {
        // 画面幅チェック
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 768;
        const isVerySmall = screenWidth <= 480;
        
        if (isVerySmall) {
            // 480px以下では独立したリストコンテナを使用
            const listHTML = buildRecipeListHTML(recipeName);
            listDiv.innerHTML = `
                <div class="recipe-list-header">
                    <h4><i class="fas fa-list"></i> 必要材料リスト</h4>
                </div>
                <div class="recipe-list-content">
                    ${listHTML}
                </div>
            `;
            
            // ツリーコンテナを非表示、リストコンテナを表示
            container.style.display = 'none';
            listContainer.style.display = 'block';
        } else {
            // 481px以上では従来のツリー形式
            const treeHTML = buildRecipeTreeHTML(recipeName, 0, new Set(), null, isMobile);
            
            // モバイル用のヘッダーとトグルボタンを追加
            if (isMobile) {
                const headerHTML = `
                    <div class="tree-mobile-header">
                        <button class="tree-toggle-btn" onclick="toggleRecipeTreeDetails()">
                            <i class="fas fa-eye" id="treeToggleIcon"></i>
                            <span id="treeToggleText">詳細表示</span>
                        </button>
                    </div>
                `;
                treeDiv.innerHTML = headerHTML + `<div id="recipeTreeContent" class="tree-collapsed">${treeHTML}</div>`;
            } else {
                treeDiv.innerHTML = treeHTML;
            }
            
            // リストコンテナを非表示、ツリーコンテナを表示
            listContainer.style.display = 'none';
            container.style.display = 'block';
        }
        
        // DOM更新後に折りたたみイベントを設定
        setTimeout(() => {
            initializeTreeToggle();
        }, 10);
    } catch (error) {
        console.error('Error building recipe tree:', error);
        hideRecipeTree();
    }
}

/**
 * レシピのシンプルなリスト形式HTMLを構築（小画面用）
 * @param {string} recipeName - レシピ名
 * @returns {string} リスト形式のHTML
 */
function buildRecipeListHTML(recipeName) {
    const recipe = recipeDB.getRecipe(recipeName);
    if (!recipe) {
        return '<div class="list-error">レシピが見つかりません</div>';
    }
    
    try {
        // 材料を展開して必要量を取得
        const expandedIngredients = recipeDB.expandIngredients(recipeName, 1);
        
        if (!expandedIngredients || Object.keys(expandedIngredients).length === 0) {
            return '<div class="list-empty">必要な材料がありません</div>';
        }
        
        // 材料をソートして表示
        const sortedIngredients = Object.entries(expandedIngredients)
            .sort(([a], [b]) => a.localeCompare(b, 'ja'));
        
        let listHTML = '<ul class="recipe-ingredient-list">';
        
        for (const [ingredientName, amount] of sortedIngredients) {
            const ingredientRecipe = recipeDB.getRecipe(ingredientName);
            const icon = ingredientRecipe ? ingredientRecipe.icon || 'fa-cube' : 'fa-cube';
            const itemType = ingredientRecipe ? (ingredientRecipe.type === 'basic' ? '基本材料' : 'レシピ') : '不明';
            const typeClass = ingredientRecipe ? (ingredientRecipe.type === 'basic' ? 'basic' : 'recipe') : 'unknown';
            
            listHTML += `
                <li class="recipe-list-item ${typeClass}">
                    <div class="item-info">
                        <i class="fas ${icon} item-icon"></i>
                        <span class="item-name">${ingredientName}</span>
                        <span class="item-type">(${itemType})</span>
                    </div>
                    <div class="item-amount">
                        <span class="amount-value">${amount}</span>
                    </div>
                </li>
            `;
        }
        
        listHTML += '</ul>';
        return listHTML;
        
    } catch (error) {
        console.error('Error building recipe list:', error);
        return '<div class="list-error">材料リストの生成でエラーが発生しました</div>';
    }
}

/**
 * レシピツリーのHTMLを再帰的に構築
 * @param {string} recipeName - レシピ名
 * @param {number} depth - ツリーの深度
 * @param {Set} visited - 循環参照チェック用のセット
 * @param {number|null} amount - 材料の必要量
 * @param {boolean} isMobile - モバイル表示かどうか
 * @returns {string} ツリーノードのHTML
 */
function buildRecipeTreeHTML(recipeName, depth = 0, visited = new Set(), amount = null, isMobile = false) {
    // 循環参照チェック
    if (visited.has(recipeName)) {
        return createErrorTreeNode(recipeName, depth, amount, 'fa-exclamation-triangle', '循環参照');
    }
    
    const recipe = recipeDB.getRecipe(recipeName);
    if (!recipe) {
        return createErrorTreeNode(recipeName, depth, amount, 'fa-question-circle', '見つかりません');
    }
    
/**
 * エラー状態のツリーノードHTMLを生成
 * @param {string} recipeName - レシピ名
 * @param {number} depth - ツリーの深度
 * @param {number|null} amount - 材料の必要量
 * @param {string} iconClass - エラーアイコンのクラス
 * @param {string} errorMessage - エラーメッセージ
 * @returns {string} エラーノードのHTML
 */
function createErrorTreeNode(recipeName, depth, amount, iconClass, errorMessage) {
    return `<div class="tree-node error" data-depth="${depth}" data-node-id="${recipeName}-${Math.random()}">
        <div class="node-content">
            <div class="node-info">
                <i class="fas ${iconClass} node-icon"></i>
                <span class="node-name">${recipeName} (${errorMessage})</span>
            </div>
            ${amount && depth > 0 ? `<div class="ingredient-amount"><span class="amount-badge">${amount}</span></div>` : ''}
        </div>
    </div>`;
}

    visited.add(recipeName);
    
    const icon = recipe.icon || 'fa-utensils';
    const nodeClass = recipe.type === 'basic' ? 'basic-ingredient' : 'recipe';
    const nodeId = `${recipeName}-${depth}-${Math.random()}`;
    
    // 数量情報があるかチェック（親から渡される）
    const amountInfo = amount;
    
    let html = `<div class="tree-node ${nodeClass}" data-depth="${depth}" data-node-id="${nodeId}">
        <div class="node-content">
            <div class="node-info">
                <i class="fas ${icon} node-icon"></i>
                <span class="node-name">${recipe.name}</span>
                <span class="node-type">(${recipe.type === 'basic' ? '基本材料' : 'レシピ'})</span>
            </div>
            ${amountInfo && depth > 0 ? `<div class="ingredient-amount">量: <span class="amount-badge">${amountInfo}</span></div>` : ''}
        </div>`;
    
    // 材料がある場合は子ノードを追加
    if (recipe.ingredients && Object.keys(recipe.ingredients).length > 0) {
        html += '<div class="node-children">';
        for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
            html += buildRecipeTreeHTML(ingredient, depth + 1, new Set(visited), amount, isMobile);
        }
        html += '</div>';
    }
    
    html += '</div>';
    
    visited.delete(recipeName);
    return html;
}

// ===========================================
// ツリー折りたたみ機能
// ===========================================

/**
 * ツリーの折りたたみ機能を初期化
 */
function initializeTreeToggle() {
    const treeContainer = document.getElementById('recipeTree');
    if (!treeContainer) {
        console.warn('Recipe tree container not found');
        return;
    }
    
    // 子ノードを持つノードに折りたたみボタンを追加
    const nodesWithChildren = treeContainer.querySelectorAll('.tree-node');
    nodesWithChildren.forEach(node => {
        const childrenContainer = node.querySelector('.node-children');
        if (childrenContainer && childrenContainer.children.length > 0) {
            addToggleButton(node);
        }
    });
}

/**
 * ノードに折りたたみボタンを追加
 * @param {HTMLElement} node - ノード要素
 */
function addToggleButton(node) {
    const nodeContent = node.querySelector('.node-content');
    if (!nodeContent) return;
    
    // 既にボタンがある場合はスキップ
    if (nodeContent.querySelector('.toggle-button')) return;
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-button';
    toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
    toggleButton.title = '折りたたみ';
    
    // クリックイベントを追加
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNodeChildren(node);
    });
    
    // ボタンをノードコンテントの先頭に追加
    nodeContent.insertBefore(toggleButton, nodeContent.firstChild);
}

/**
 * ノードの子要素の表示/非表示を切り替え
 * @param {HTMLElement} node - ノード要素
 */
function toggleNodeChildren(node) {
    const childrenContainer = node.querySelector('.node-children');
    const toggleButton = node.querySelector('.toggle-button');
    const icon = toggleButton ? toggleButton.querySelector('i') : null;
    
    if (!childrenContainer || !icon) return;
    
    const isCollapsed = childrenContainer.style.display === 'none';
    
    if (isCollapsed) {
        // 展開
        childrenContainer.style.display = '';
        icon.className = 'fas fa-chevron-down';
        node.classList.remove('collapsed');
        toggleButton.title = '折りたたみ';
    } else {
        // 折りたたみ
        childrenContainer.style.display = 'none';
        icon.className = 'fas fa-chevron-right';
        node.classList.add('collapsed');
        toggleButton.title = '展開';
    }
}

/**
 * レシピツリーを非表示にする
 */
function hideRecipeTree() {
    const container = document.getElementById('recipeTreeContainer');
    const listContainer = document.getElementById('recipeListContainer');
    
    if (container) {
        container.style.display = 'none';
    }
    
    if (listContainer) {
        listContainer.style.display = 'none';
    }
}

// 計算結果をクリア
function clearCalculationResult() {
    const resultDiv = document.getElementById('calculationResult');
    if (resultDiv) {
        resultDiv.innerHTML = '';
    }
}



// レシピ統計を更新
function updateRecipeStats() {
    try {
        const recipeCountEl = document.getElementById('recipeCount');
        const basicItemCountEl = document.getElementById('basicItemCount');
        
        if (recipeCountEl) {
            const allRecipes = recipeDB.getAllRecipes();
            const recipeCount = allRecipes.filter(r => r.type === 'recipe').length;
            recipeCountEl.textContent = recipeCount;
        }
        
        if (basicItemCountEl) {
            const basicItems = recipeDB.getBasicItems();
            basicItemCountEl.textContent = basicItems.length;
        }
    } catch (error) {
        console.error('Error in updateRecipeStats:', error);
    }
}

// ===========================================
// モバイル用レシピツリー機能
// ===========================================

/**
 * モバイル用レシピツリーの詳細表示を切り替え
 */
function toggleRecipeTreeDetails() {
    const content = document.getElementById('recipeTreeContent');
    const icon = document.getElementById('treeToggleIcon');
    const text = document.getElementById('treeToggleText');
    
    if (!content || !icon || !text) return;
    
    const isCollapsed = content.classList.contains('tree-collapsed');
    
    if (isCollapsed) {
        content.classList.remove('tree-collapsed');
        content.classList.add('tree-expanded');
        icon.className = 'fas fa-eye-slash';
        text.textContent = '簡略表示';
    } else {
        content.classList.remove('tree-expanded');
        content.classList.add('tree-collapsed');
        icon.className = 'fas fa-eye';
        text.textContent = '詳細表示';
    }
}

// グローバル関数として登録
window.toggleRecipeTreeDetails = toggleRecipeTreeDetails;

// ===========================================
// レスポンシブ表示切り替え機能
// ===========================================

/**
 * 画面サイズに応じてレシピ表示を更新
 */
function handleRecipeDisplayResize() {
    const treeContainer = document.getElementById('recipeTreeContainer');
    const listContainer = document.getElementById('recipeListContainer');
    
    if ((!treeContainer || treeContainer.style.display === 'none') && 
        (!listContainer || listContainer.style.display === 'none')) {
        return; // 両方とも表示されていない場合は何もしない
    }
    
    // 現在表示中のレシピ名を取得
    const selectedRecipe = getSelectValue('selectedRecipe');
    if (!selectedRecipe || selectedRecipe === '') {
        return;
    }
    
    // 表示を再構築
    buildAndShowRecipeTree(selectedRecipe);
}

/**
 * ウィンドウリサイズイベントの設定
 */
function initializeResponsiveRecipeDisplay() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        // デバウンス処理（リサイズ完了後に実行）
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleRecipeDisplayResize, 250);
    });
}

// ページ読み込み時にリサイズ対応を初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeResponsiveRecipeDisplay();
});

