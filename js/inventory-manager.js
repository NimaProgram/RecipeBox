// インベントリ関連の関数

// インベントリ状態を更新
function updateInventoryStatus() {
    try {
        if (!recipeDB.currentMainRecipe) {
            console.log('No current main recipe set');
            return;
        }
        
        const inventoryGrid = document.querySelector('.inventory-grid');
        if (!inventoryGrid) {
            console.warn('inventory-grid element not found');
            return;
        }
        
        // 必要な材料を計算
        const expandedIngredients = recipeDB.expandIngredients(recipeDB.currentMainRecipe, 1);
        
        // 現在のインベントリカードの状態を保存
        const currentInputs = {};
        const existingCards = inventoryGrid.querySelectorAll('.inventory-card');
        existingCards.forEach(card => {
            const input = card.querySelector('.inventory-input');
            if (input) {
                currentInputs[input.dataset.ingredient] = input.value;
            }
        });
        
        inventoryGrid.innerHTML = '';
        
        // 基本アイテムのみ表示
        for (const [ingredient, totalNeeded] of Object.entries(expandedIngredients)) {
            const ingredientData = recipeDB.getRecipe(ingredient);
            if (!ingredientData || ingredientData.type === 'basic') {
                const card = createInventoryCard(ingredient, totalNeeded, currentInputs[ingredient] || '0');
                inventoryGrid.appendChild(card);
            }
        }
    } catch (error) {
        console.error('Error in updateInventoryStatus:', error);
        showNotification(`インベントリ更新エラー: ${error.message}`, 'error');
    }
}

// インベントリカードを作成
function createInventoryCard(ingredient, needed, currentValue) {
    const div = document.createElement('div');
    div.className = 'inventory-card';
    
    const current = parseInt(currentValue) || 0;
    const statusClass = current >= needed ? 'sufficient' : 'insufficient';
    
    const ingredientData = recipeDB.getRecipe(ingredient);
    const icon = ingredientData ? ingredientData.icon : 'fa-cube';
    
    div.innerHTML = `
        <div class="inventory-item">
            <div class="inventory-checkbox-container">
                <input 
                    type="checkbox" 
                    id="checkbox-${ingredient}" 
                    class="inventory-checkbox" 
                    data-ingredient="${ingredient}"
                >
                <label for="checkbox-${ingredient}" class="checkbox-label"></label>
            </div>
            <i class="fas ${icon} ingredient-icon"></i>
            <span class="ingredient-name">${ingredient}</span>
        </div>
        <div class="inventory-amounts">
            <div class="current-amount">
                <label for="inventory-${ingredient}">現在:</label>
                <input 
                    type="number" 
                    id="inventory-${ingredient}"
                    class="inventory-input" 
                    data-ingredient="${ingredient}"
                    value="${currentValue}" 
                    min="0"
                >
            </div>
            <div class="needed-amount">
                <span>必要: ${needed}</span>
            </div>
        </div>
        <div class="status-indicator ${statusClass}">
            ${current >= needed ? '✓' : '✗'}
        </div>
    `;
    
    // イベントリスナーを追加
    const input = div.querySelector('.inventory-input');
    if (input) {
        input.addEventListener('input', debounce((e) => {
            updateInventoryFromInput(e.target.dataset.ingredient, e.target.value);
        }, 300));
    }
    
    // チェックボックスのイベントリスナーを追加
    const checkbox = div.querySelector('.inventory-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            updateInventoryCardColor(e.target.dataset.ingredient, e.target.checked);
        });
    }
    
    return div;
}

// インベントリの入力から更新
function updateInventoryFromInput(ingredient, value) {
    try {
        const amount = parseInt(value) || 0;
        recipeDB.setInventory(ingredient, amount);
        
        // 該当するカードのステータスを更新
        const card = document.querySelector(`input[data-ingredient="${ingredient}"]`).closest('.inventory-card');
        if (card) {
            const neededSpan = card.querySelector('.needed-amount span');
            const needed = parseInt(neededSpan.textContent.replace('必要: ', '')) || 0;
            const statusIndicator = card.querySelector('.status-indicator');
            
            if (amount >= needed) {
                statusIndicator.className = 'status-indicator sufficient';
                statusIndicator.textContent = '✓';
            } else {
                statusIndicator.className = 'status-indicator insufficient';
                statusIndicator.textContent = '✗';
            }
        }
        
        saveAllToLocalStorage();
    } catch (error) {
        console.error('Error in updateInventoryFromInput:', error);
        showNotification(`インベントリ更新エラー: ${error.message}`, 'error');
    }
}



// チェックボックスの状態によってカードの色を変更
function updateInventoryCardColor(ingredient, isChecked) {
    try {
        const card = document.querySelector(`input[data-ingredient="${ingredient}"]`).closest('.inventory-card');
        if (card) {
            if (isChecked) {
                card.classList.add('checked');
            } else {
                card.classList.remove('checked');
            }
        }
    } catch (error) {
        console.error('Error updating inventory card color:', error);
    }
}

// すべてのチェックボックスをオン/オフする関数
function toggleAllInventoryCheckboxes(checked) {
    try {
        const checkboxes = document.querySelectorAll('.inventory-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            updateInventoryCardColor(checkbox.dataset.ingredient, checked);
        });
    } catch (error) {
        console.error('Error toggling all checkboxes:', error);
    }
}

// デバウンス関数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// グローバル関数として公開
window.updateInventoryCardColor = updateInventoryCardColor;
window.toggleAllInventoryCheckboxes = toggleAllInventoryCheckboxes;
window.updateInventoryFromInput = updateInventoryFromInput;