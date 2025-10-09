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
    
    if (!container || !treeDiv) {
        console.warn('Recipe tree DOM elements not found');
        return;
    }
    
    try {
        // ツリーHTMLを構築
        const treeHTML = buildRecipeTreeHTML(recipeName, 0, new Set());
        treeDiv.innerHTML = treeHTML;
        
        // コンテナを表示
        container.style.display = 'block';
        
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
 * レシピツリーのHTMLを再帰的に構築
 * @param {string} recipeName - レシピ名
 * @param {number} depth - ツリーの深度
 * @param {Set} visited - 循環参照チェック用のセット
 * @param {number|null} amount - 材料の必要量
 * @returns {string} ツリーノードのHTML
 */
function buildRecipeTreeHTML(recipeName, depth = 0, visited = new Set(), amount = null) {
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
            html += buildRecipeTreeHTML(ingredient, depth + 1, new Set(visited), amount);
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
    if (container) {
        container.style.display = 'none';
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

