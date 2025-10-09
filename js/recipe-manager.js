// レシピ管理関連の関数
let currentEditingRecipe = null;

// レシピマネージャーを表示
function showRecipeManager(recipeName = null) {
    currentEditingRecipe = recipeName;
    const modal = document.getElementById('recipeManagerModal');
    const title = document.getElementById('modalTitle');
    
    if (recipeName) {
        title.textContent = 'レシピ編集';
        loadRecipeForEdit(recipeName);
    } else {
        title.textContent = 'レシピ追加';
        clearRecipeForm();
    }
    
    // updateAvailableIngredients(); // 一時的に無効化
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// 重複した関数を削除（アニメーション付きの関数を使用）

// メインレシピ作成画面を表示
function showCreateMainRecipe() {
    showRecipeManager();
    
}

// レシピフォームをクリア
function clearRecipeForm() {
    document.getElementById('recipeForm').reset();
    document.getElementById('baseQuantity').value = 1;
    document.getElementById('ingredientsList').innerHTML = '';
    addIngredient(); // 最初の材料入力欄を追加
}

// 編集用にレシピをロード
function loadRecipeForEdit(recipeName) {
    const recipe = recipeDB.getRecipe(recipeName);
    if (!recipe) return;
    
    document.getElementById('recipeName').value = recipe.name;
    
    document.getElementById('baseQuantity').value = recipe.baseQuantity || 1;
    setSelectValue('recipeIcon', recipe.icon || 'fa-utensils');
    
    
    // 材料リストをロード
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';
    
    if (recipe.ingredients && Object.keys(recipe.ingredients).length > 0) {
        for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
            addIngredient(ingredient, amount);
        }
    } else {
        addIngredient();
    }
}

// 新しい材料追加ダイアログを表示
function showAddIngredientDialog(selectElement, ingredientDiv) {
    const ingredientName = prompt('新しい材料の名前を入力してください:');
    
    if (!ingredientName || ingredientName.trim() === '') {
        selectElement.value = ''; // 選択をリセット
        return;
    }
    
    const trimmedName = ingredientName.trim();
    
    // 既存の材料名と重複チェック
    if (recipeDB.getRecipe(trimmedName)) {
        alert(`「${trimmedName}」は既に存在します。`);
        selectElement.value = ''; // 選択をリセット
        return;
    }
    
    // アイコン選択ダイアログ
    const iconOptions = [
        { value: 'fa-utensils', label: '基本 (🍴)' },
        { value: 'fa-egg', label: '卵 (🥚)' },
        { value: 'fa-glass-water', label: '液体 (🥛)' },
        { value: 'fa-bread-slice', label: 'パン/生地 (🍞)' },
        { value: 'fa-cheese', label: 'チーズ (🧀)' },
        { value: 'fa-butter', label: 'バター (🧈)' },
        { value: 'fa-ice-cream', label: 'クリーム (🍦)' },
        { value: 'fa-salt-shaker', label: '調味料 (🧂)' },
        { value: 'fa-cube', label: '粉/固形 (⬜)' },
        { value: 'fa-fish', label: '魚 (🐟)' },
        { value: 'fa-drumstick-bite', label: '肉 (🍗)' },
        { value: 'fa-carrot', label: '野菜 (🥕)' },
        { value: 'fa-apple-alt', label: '果物 (🍎)' }
    ];
    
    let iconMessage = `「${trimmedName}」のアイコンを選択してください:\n\n`;
    iconOptions.forEach((option, index) => {
        iconMessage += `${index + 1}. ${option.label}\n`;
    });
    iconMessage += '\n番号を入力してください (1-' + iconOptions.length + '):';
    
    const iconChoice = prompt(iconMessage);
    const iconIndex = parseInt(iconChoice) - 1;
    
    let selectedIcon = 'fa-utensils'; // デフォルト
    if (iconIndex >= 0 && iconIndex < iconOptions.length) {
        selectedIcon = iconOptions[iconIndex].value;
    }
    
    // 説明を入力（オプション）
    const description = prompt(`「${trimmedName}」の説明を入力してください (オプション):`) || '';
    
    try {
        // 新しい基本材料を追加
        recipeDB.addItem(trimmedName, {
            icon: selectedIcon,
            
        });
        
        // セレクトボックスに新しい材料を追加
        const newOption = document.createElement('option');
        newOption.value = trimmedName;
        newOption.textContent = `${trimmedName} (基本材料)`;
        newOption.selected = true;
        
        // セパレーターの後に追加
        const separator = selectElement.querySelector('option[disabled]');
        selectElement.insertBefore(newOption, separator.nextSibling);
        
        // 他の材料選択欄も更新
        updateAllIngredientSelects();
        
        showNotification(`新しい材料「${trimmedName}」を追加しました`, 'success');
        
    } catch (error) {
        console.error('Error adding ingredient:', error);
        alert('材料の追加に失敗しました: ' + error.message);
        selectElement.value = ''; // 選択をリセット
    }
}

// すべての材料選択欄を更新（カスタムドロップダウン版）
function updateAllIngredientSelects() {
    
    // カスタムドロップダウンも更新
    if (window.dropdownIntegration && dropdownIntegration.dropdowns) {
        console.log('Updating custom ingredient dropdowns...');
        let updatedCount = 0;
        
        // 全てのカスタムドロップダウンを更新
        dropdownIntegration.dropdowns.forEach((dropdown, key) => {
            // 材料選択用のドロップダウンかどうかを確認
            const container = dropdown.container;
            if (container && container.closest('#ingredientsList')) {
                const currentValue = dropdown.getValue();
                
                // オプション配列を作成
                const options = [
                    { value: '', text: '材料を選択...', disabled: true }
                ];
                
                // 材料を追加
                recipeDB.getAllRecipes().forEach(recipe => {
                    options.push({
                        value: recipe.name,
                        text: `${recipe.name} (${recipe.type === 'basic' ? '基本材料' : 'レシピ'})`,
                        icon: recipe.icon || (recipe.type === 'basic' ? 'fa-leaf' : 'fa-utensils')
                    });
                });
                
                // ドロップダウンのオプションを更新
                dropdown.setOptions(options);
                
                // 新規追加機能を再有効化
                if (!dropdown.menu.querySelector('.custom-dropdown-add-new')) {
                    dropdown.enableAddNew('+ 新しい材料を追加');
                }
                
                // 以前の選択値を復元
                if (currentValue && recipeDB.getRecipe(currentValue)) {
                    dropdown.setValue(currentValue);
                } else if (!currentValue) {
                    dropdown.setPlaceholder('材料を選択...');
                }
                
                console.log(`Updated ingredient dropdown: ${key} with ${options.length} options`);
                updatedCount++;
            }
        });
        
        console.log(`Total ingredient dropdowns updated: ${updatedCount}`);
    }
}

// 利用可能な材料リストを更新
function updateAvailableIngredients() {
    // 材料選択欄を動的に更新
    const selects = document.querySelectorAll('#ingredientsList select');
    selects.forEach(select => {
        updateSelectOptions(select);
    });
}

// セレクトボックスのオプションを更新
function updateSelectOptions(select) {
    const currentValue = select.value;
    
    // 既存のオプション（最初の3つ以外）をクリア
    while (select.options.length > 3) {
        select.remove(3);
    }
    
    // 材料を追加
    recipeDB.getAllRecipes().forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = `${recipe.name} (${recipe.type === 'basic' ? '基本材料' : 'レシピ'})`;
        select.appendChild(option);
    });
    
    // 元の選択を復元
    select.value = currentValue;
}

// select要素またはカスタムドロップダウンの値を設定するヘルパー関数
function setSelectValue(elementId, value) {
    // 元のselect要素を探す
    let element = document.getElementById(elementId);
    
    if (element && element.tagName === 'SELECT') {
        // 元のselect要素が存在する場合
        element.value = value;
        return true;
    }
    
    // カスタムドロップダウンを探す（グローバル変数とwindowプロパティの両方をチェック）
    const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
    if (integration && integration.dropdowns) {
        const dropdown = integration.getDropdown ? integration.getDropdown(elementId) : null;
        if (dropdown) {
            dropdown.setValue(value);
            return true;
        }
        
        // 直接マップから検索
        for (const [key, dd] of integration.dropdowns) {
            if (key === elementId || key.includes(elementId)) {
                dd.setValue(value);
                return true;
            }
        }
    }
    
    // カスタムドロップダウンのコンテナを直接探す
    const customContainer = document.getElementById(elementId + '_custom') || 
                           document.querySelector(`[data-original-id="${elementId}"]`);
    if (customContainer && integration && integration.dropdowns) {
        // dropdownIntegrationから取得を試行
        for (const [key, dd] of integration.dropdowns) {
            if (dd.container === customContainer) {
                dd.setValue(value);
                return true;
            }
        }
    }
    
    console.warn(`Could not set value for element: ${elementId}`, {
        element: element,
        customContainer: document.getElementById(elementId + '_custom'),
        hasDropdownIntegration: !!window.dropdownIntegration,
        dropdownCount: window.dropdownIntegration ? dropdownIntegration.dropdowns.size : 0
    });
    return false;
}

// select要素またはカスタムドロップダウンの値を取得するヘルパー関数
function getSelectValue(elementId) {
    // 元のselect要素を探す
    let element = document.getElementById(elementId);
    
    if (element && element.tagName === 'SELECT') {
        return element.value;
    }
    
    // カスタムドロップダウンを探す（グローバル変数とwindowプロパティの両方をチェック）
    const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
    if (integration && integration.dropdowns) {
        const dropdown = integration.getDropdown ? integration.getDropdown(elementId) : null;
        if (dropdown) {
            return dropdown.getValue();
        }
        
        // 直接マップから検索
        for (const [key, dd] of integration.dropdowns) {
            if (key === elementId || key.includes(elementId)) {
                return dd.getValue();
            }
        }
    }
    
    return '';
}

// モーダルを滑らかに閉じる汎用関数
function closeModalWithAnimation(modalId, callback = null) {
    const modal = document.getElementById(modalId);
    const modalContent = modal.querySelector('.modal-content');
    
    // 閉じるアニメーションクラスを追加
    modalContent.classList.add('closing');
    
    // アニメーション完了後にモーダルを非表示にする
    setTimeout(() => {
        modal.style.display = 'none';
        modalContent.classList.remove('closing');
        document.body.classList.remove('modal-open');
        if (callback) callback();
    }, 300); // CSS アニメーション時間と同じ
}

// レシピマネージャーを閉じる
function closeRecipeManager() {
    closeModalWithAnimation('recipeManagerModal', () => {
        currentEditingRecipe = null;
        
        // 材料入力欄をクリーンアップ
        const ingredientsList = document.getElementById('ingredientsList');
        if (ingredientsList) {
            // カスタムドロップダウンを適切に削除
            const customDropdowns = ingredientsList.querySelectorAll('.custom-dropdown');
            customDropdowns.forEach(dropdown => {
                const dropdownId = dropdown.dataset.originalId || dropdown.id;
                if (window.dropdownIntegration && dropdownIntegration.dropdowns.has(dropdownId)) {
                    dropdownIntegration.dropdowns.delete(dropdownId);
                }
            });
            
            // 材料リストをクリア
            ingredientsList.innerHTML = '';
        }
        
        // フォームをリセット
        const form = document.getElementById('recipeForm');
        if (form) {
            form.reset();
        }
    });
}

// 材料入力欄を追加
function addIngredient(selectedIngredient = '', amount = 1) {
    const ingredientsList = document.getElementById('ingredientsList');
    const div = document.createElement('div');
    div.className = 'ingredient-entry';
    
    // カスタムドロップダウンを作成
    const select = document.createElement('select');
    select.id = `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // デフォルトオプション
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '材料を選択...';
    defaultOption.disabled = true;
    select.appendChild(defaultOption);
    
    // 利用可能な材料を追加
    recipeDB.getAllRecipes().forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = `${recipe.name} (${recipe.type === 'basic' ? '基本材料' : 'レシピ'})`;
        if (recipe.name === selectedIngredient) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = amount;
    input.placeholder = '数量';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-ingredient';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => div.remove();
    
    div.appendChild(select);
    div.appendChild(input);
    div.appendChild(removeBtn);
    ingredientsList.appendChild(div);
    
    // 選択されている材料があれば設定（カスタムドロップダウン変換後）
    if (selectedIngredient) {
        // より長い遅延で確実に変換後に実行
        setTimeout(() => {
            const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
            if (integration) {
                const dropdown = integration.getDropdown(select.id);
                if (dropdown) {
                    dropdown.setValue(selectedIngredient);
                    console.log('Set ingredient value:', selectedIngredient, 'for dropdown:', select.id);
                } else {
                    // IDで見つからない場合、コンテナで検索
                    const customDropdown = div.querySelector('.custom-dropdown');
                    if (customDropdown && integration.dropdowns) {
                        for (const [key, dd] of integration.dropdowns) {
                            if (dd.container === customDropdown) {
                                dd.setValue(selectedIngredient);
                                console.log('Set ingredient value via container:', selectedIngredient, 'for key:', key);
                                break;
                            }
                        }
                    }
                }
            }
        }, 300);
    }
}

// グローバル変数：現在編集中の選択要素
let currentEditingSelect = null;

// 新しい材料追加ダイアログを表示
function showAddIngredientDialog(selectElement, ingredientDiv) {
    console.log('showAddIngredientDialog called with:', selectElement, ingredientDiv);
    
    // 現在編集中の要素を保存
    currentEditingSelect = selectElement;
    
    // DOMが確実に利用可能になるまで待つ
    const initializeDialog = () => {
        try {
            console.log('Initializing add ingredient dialog...');
            console.log('Document ready state:', document.readyState);
            
            // フォーム要素をクリア
            const nameInput = document.getElementById('newIngredientName');
            console.log('Name input found:', !!nameInput);
            
            if (nameInput) {
                nameInput.value = '';
            }
            
            // アイコン選択をリセット
            resetIngredientIconSelection();
            
            // モーダルを表示
            const modal = document.getElementById('addIngredientModal');
            console.log('Modal found:', !!modal);
            
            if (modal) {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
                
                // フォーカスを設定
                if (nameInput) {
                    setTimeout(() => nameInput.focus(), 50);
                }
            } else {
                console.error('Modal element not found');
            }
            
        } catch (error) {
            console.error('Error in showAddIngredientDialog:', error);
        }
    };
    
    // DOMの状態に応じて実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDialog);
    } else {
        setTimeout(initializeDialog, 10);
    }
}

// アイコン選択をリセットする補助関数
function resetIngredientIconSelection() {
    try {
        console.log('=== resetIngredientIconSelection ===');
        const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
        console.log('Integration available:', !!integration);
        
        if (integration) {
            console.log('Dropdowns in integration:', integration.dropdowns.size);
            console.log('Available dropdown keys:', Array.from(integration.dropdowns.keys()));
            
            // カスタムドロップダウンの場合
            const iconDropdown = integration.getDropdown('newIngredientIcon');
            console.log('Icon dropdown found:', !!iconDropdown);
            
            if (iconDropdown) {
                console.log('Icon dropdown setValue method available:', typeof iconDropdown.setValue);
                if (iconDropdown.setValue) {
                    iconDropdown.setValue('fa-utensils');
                    console.log('Icon dropdown reset to fa-utensils');
                }
            } else {
                console.log('No icon dropdown found, checking for custom ID...');
                const customIconDropdown = integration.getDropdown('newIngredientIcon_custom');
                console.log('Custom icon dropdown found:', !!customIconDropdown);
            }
        } else {
            // 通常のselect要素の場合
            console.log('Using fallback to regular select element');
            const iconSelect = document.getElementById('newIngredientIcon');
            console.log('Icon select element found:', !!iconSelect);
            if (iconSelect) {
                iconSelect.value = 'fa-utensils';
                console.log('Icon select reset to fa-utensils');
            }
        }
    } catch (error) {
        console.error('Error resetting icon selection:', error);
    }
}

// グローバルに利用可能にする
window.showAddIngredientDialog = showAddIngredientDialog;

// 新しい材料追加モーダルを閉じる
function closeAddIngredientModal() {
    closeModalWithAnimation('addIngredientModal');
    
    // 選択をリセット
    if (currentEditingSelect) {
        // カスタムドロップダウンの場合は値をリセットしない（選択を保持）
        if (!currentEditingSelect.classList.contains('custom-dropdown')) {
            currentEditingSelect.value = '';
        }
        currentEditingSelect = null;
    }
}

// 利用可能な材料リストを更新
function updateAvailableIngredients() {
    // 材料選択欄を動的に更新
    const selects = document.querySelectorAll('#ingredientsList select');
    selects.forEach(select => {
        updateSelectOptions(select);
    });
}

// セレクトボックスのオプションを更新
function updateSelectOptions(select) {
    const currentValue = select.value;
    
    // 既存のオプション（最初の3つ以外）をクリア
    while (select.options.length > 3) {
        select.remove(3);
    }
    
    // 材料を追加
    recipeDB.getAllRecipes().forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = `${recipe.name} (${recipe.type === 'basic' ? '基本材料' : 'レシピ'})`;
        select.appendChild(option);
    });
    
    // 元の選択を復元
    select.value = currentValue;
}
// レシピを保存
function saveRecipe() {
    const form = document.getElementById('recipeForm');
    const formData = new FormData(form);
    
    const recipeName = document.getElementById('recipeName').value.trim();
    if (!recipeName) {
        showNotification('レシピ名を入力してください', 'error');
        return;
    }
    
    // 材料を収集
    const ingredients = {};
    const ingredientEntries = document.querySelectorAll('.ingredient-entry');
    
    console.log('Found ingredient entries:', ingredientEntries.length);
    
    for (const entry of ingredientEntries) {
        const input = entry.querySelector('input[type="number"]'); // 数量入力欄のみを取得
        let selectValue = '';
        
        // カスタムドロップダウンから値を取得
        const customDropdown = entry.querySelector('.custom-dropdown');
        if (customDropdown) {
            const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
            if (integration && integration.dropdowns) {
                // まず、original-idでドロップダウンを探す
                const originalId = customDropdown.dataset.originalId;
                if (originalId) {
                    const dropdown = integration.getDropdown(originalId);
                    if (dropdown) {
                        selectValue = dropdown.getValue();
                        console.log('Found ingredient via original ID:', selectValue, 'from:', originalId);
                    }
                }
                
                // original-idで見つからない場合、コンテナで検索
                if (!selectValue) {
                    for (const [key, dropdown] of integration.dropdowns) {
                        if (dropdown.container === customDropdown) {
                            selectValue = dropdown.getValue();
                            console.log('Found ingredient via container:', selectValue, 'key:', key);
                            break;
                        }
                    }
                }
                
                if (!selectValue) {
                    console.warn('Could not find dropdown value for:', customDropdown, 'originalId:', originalId);
                    console.log('Available dropdown keys:', Array.from(integration.dropdowns.keys()));
                }
            }
        } else {
            console.warn('No custom dropdown found in entry:', entry);
        }
        

        
        if (selectValue && input && input.value > 0) {
            ingredients[selectValue] = parseInt(input.value);
        }
    }

    

    
    // レシピデータを作成
    const iconValue = getSelectValue('recipeIcon') || 'fa-utensils';
    const newRecipeData = {
        name: recipeName,
        baseQuantity: parseInt(document.getElementById('baseQuantity').value) || 1,
        ingredients: ingredients,
        icon: iconValue
    };
    
    // 循環参照チェック
    if (newRecipeData.ingredients[recipeName]) {
        showNotification('レシピが自分自身を材料として参照することはできません', 'error');
        return;
    }
    
    // レシピを保存
    if (Object.keys(ingredients).length === 0) {
        // 基本材料として追加
        recipeDB.addItem(recipeName, {
            icon: newRecipeData.icon
        });
    } else {
        // レシピとして追加
        recipeDB.addRecipe(recipeName, newRecipeData);
    }
    
    // 編集中の場合の処理
    if (currentEditingRecipe && currentEditingRecipe !== recipeName) {
        // 名前が変更された場合、古いレシピを削除
        recipeDB.deleteRecipe(currentEditingRecipe);
    }
    
    // UIを更新
    updateAllUI();
    
    // レシピ一覧が開いている場合は更新
    const recipeListModal = document.getElementById('recipeListModal');
    if (recipeListModal && recipeListModal.style.display === 'block') {
        updateRecipeListDisplay();
    }
    
    closeRecipeManager();
    showNotification(`レシピ「${recipeName}」を保存しました`, 'success');
}



// レシピを選択
function selectRecipe(recipeName) {
    recipeDB.setCurrentMainRecipe(recipeName);
    updateAllUI();
    closeRecipeList();
    
    // 選択中のレシピセクションを表示
    const currentSection = document.getElementById('currentRecipeSection');
    if (currentSection) {
        currentSection.style.display = 'block';
    }
    
    showNotification(`「${recipeName}」を選択しました`, 'success');
}

// クイック検索機能
function quickSearchRecipes() {
    const searchTerm = document.getElementById('quickSearch').value.toLowerCase();
    const recipes = recipeDB.getAllRecipes();
    
    if (searchTerm.length < 2) {
        return;
    }
    
    const matches = recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // 最初の5件のみ表示
    
    if (matches.length === 1) {
        // 1件のみの場合は自動選択
        selectRecipe(matches[0].name);
        document.getElementById('quickSearch').value = '';
    }
}

// 現在のレシピを編集
function editCurrentRecipe() {
    if (recipeDB.currentMainRecipe) {
        showRecipeManager(recipeDB.currentMainRecipe);
    } else {
        showNotification('編集するレシピが選択されていません', 'warning');
    }
}

// レシピを複製
function duplicateRecipe() {
    if (!recipeDB.currentMainRecipe) {
        showNotification('複製するレシピが選択されていません', 'warning');
        return;
    }
    
    const originalRecipe = recipeDB.getRecipe(recipeDB.currentMainRecipe);
    if (!originalRecipe) return;
    
    const newName = prompt(`「${originalRecipe.name}」のコピーを作成します。新しい名前を入力してください:`, `${originalRecipe.name}のコピー`);
    if (!newName || newName === originalRecipe.name) return;
    
    // 既存のレシピ名と重複チェック
    if (recipeDB.getRecipe(newName)) {
        showNotification('同名のレシピが既に存在します', 'error');
        return;
    }
    
    // レシピを複製
    const duplicatedRecipe = {
        ...originalRecipe,
        name: newName,
        description: `${originalRecipe.description || ''} (コピー)`.trim()
    };
    
    recipeDB.addRecipe(newName, duplicatedRecipe);
    updateAllUI();
    showNotification(`「${newName}」を作成しました`, 'success');
}

// レシピ一覧を表示
function showRecipeList() {
    const modal = document.getElementById('recipeListModal');
    if (!modal) return;
    
    updateRecipeListDisplay();
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// レシピ一覧を閉じる
function closeRecipeList() {
    closeModalWithAnimation('recipeListModal');
}

// レシピ一覧表示を更新（仮想化対応）
function updateRecipeListDisplay() {
    const content = document.getElementById('recipeListContent');
    if (!content) return;
    
    const searchTerm = document.getElementById('recipeSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('recipeTypeFilter')?.value || 'all';
    
    let recipes = recipeDB.getAllRecipes();
    
    // フィルタリング
    if (searchTerm) {
        recipes = recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter !== 'all') {
        recipes = recipes.filter(recipe => recipe.type === typeFilter);
    }
    
    content.innerHTML = '';
    
    if (recipes.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: #666;">該当するレシピがありません</p>';
        return;
    }
    
    // ヘッダー情報を追加
    const header = document.createElement('div');
    header.className = 'recipe-list-header';
    header.innerHTML = `
        <div class="recipe-count-info">
            <span class="count-badge">${recipes.length}件のレシピ</span>
            ${recipes.length > 50 ? '<span class="performance-tip">大量のレシピが表示されています。検索機能をご利用ください。</span>' : ''}
        </div>
    `;
    content.appendChild(header);
    
    // レシピアイテムをグリッド表示で効率化
    const grid = document.createElement('div');
    grid.className = 'recipe-grid-container';
    
    recipes.forEach((recipe, index) => {
        const item = document.createElement('div');
        item.className = 'recipe-grid-item';
        
        const typeLabel = recipe.type === 'basic' ? '基本材料' : 'レシピ';
        
        const ingredientCount = recipe.ingredients ? Object.keys(recipe.ingredients).length : 0;
        
        item.innerHTML = `
            <div class="recipe-card-mini">
                <div class="recipe-icon-large">
                    <i class="fas ${recipe.icon || 'fa-utensils'}"></i>
                </div>
                <div class="recipe-info">
                    <h4 class="recipe-name">${recipe.name}</h4>
                    <span class="recipe-type-badge ${recipe.type}">${typeLabel}</span>
                    ${recipe.description ? `<p class="recipe-desc">${recipe.description}</p>` : ''}
                    ${ingredientCount > 0 ? `<span class="ingredient-count">${ingredientCount}種の材料</span>` : ''}
                </div>
                <div class="recipe-actions">
                    <button class="action-btn edit" onclick="showRecipeManager('${recipe.name}')" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn select" onclick="selectRecipe('${recipe.name}')" title="選択">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteRecipe('${recipe.name}')" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(item);
    });
    
    content.appendChild(grid);
}

// レシピフィルタリング
function filterRecipes() {
    updateRecipeListDisplay();
}

// 材料を計算（HTMLから呼び出される）
function calculateMaterials() {
    console.log('Old calculateMaterials called');
    calculateMaterialsNew();
}

function calculateMaterialsNew() {
    try {
        const quantityInput = document.getElementById('quantity');
        const resultDiv = document.getElementById('calculationResult');
        
        if (!quantityInput || !resultDiv) {
            console.error('Calculator elements not found');
            return;
        }
        
        const quantity = parseInt(quantityInput.value) || 0;
        if (quantity <= 0) {
            resultDiv.innerHTML = '<p class="error">有効な個数を入力してください</p>';
            return;
        }
        
        // 選択されたレシピを取得
        const selectedRecipeName = getSelectValue('selectedRecipe');
        console.log('Selected recipe name:', selectedRecipeName);
        
        if (!selectedRecipeName) {
            resultDiv.innerHTML = '<p class="error">まずメインレシピを選択してください</p>';
            return;
        }
        
        const recipe = recipeDB.getRecipe(selectedRecipeName);
        if (!recipe) {
            resultDiv.innerHTML = '<p class="error">選択されたレシピが見つかりません</p>';
            return;
        }
        
        // 必要な材料を計算
        const expandedIngredients = recipeDB.expandIngredients(selectedRecipeName, quantity);
        
        let resultHtml = `
            <div class="calculation-header">
                <h4>${recipe.name} ${quantity}個分の必要材料</h4>
                <div class="inventory-controls">
                    <button onclick="toggleAllInventoryCheckboxes(true)" class="control-btn">
                        <i class="fas fa-check-square"></i> 全選択
                    </button>
                    <button onclick="toggleAllInventoryCheckboxes(false)" class="control-btn">
                        <i class="fas fa-square"></i> 全解除
                    </button>
                </div>
            </div>
        `;
        resultHtml += '<div class="inventory-grid">';
        
        for (const [ingredient, amount] of Object.entries(expandedIngredients)) {
            const ingredientData = recipeDB.getRecipe(ingredient);
            const icon = ingredientData ? ingredientData.icon : 'fa-cube';
            
            resultHtml += `
                <div class="inventory-card">
                    <div class="inventory-checkbox-container">
                        <input 
                            type="checkbox" 
                            id="checkbox-${ingredient}" 
                            class="inventory-checkbox" 
                            data-ingredient="${ingredient}"
                            onchange="updateInventoryCardColor('${ingredient}', this.checked)"
                        >
                        <label for="checkbox-${ingredient}" class="checkbox-label"></label>
                    </div>
                    <div class="ingredient-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="ingredient-info">
                        <div class="ingredient-name" title="${ingredient}">${ingredient}</div>
                        <div class="ingredient-amount">${amount}</div>
                    </div>
                </div>
            `;
        }
        
        resultHtml += '</div>';
        
        console.log('Generated HTML with checkboxes:', resultHtml);
        resultDiv.innerHTML = resultHtml;
        
        // チェックボックスが正しく生成されているか確認
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.inventory-checkbox');
            const labels = document.querySelectorAll('.checkbox-label');
            console.log('Found checkboxes:', checkboxes.length);
            console.log('Found labels:', labels.length);
            console.log('Sample checkbox HTML:', checkboxes[0]?.outerHTML);
        }, 100);
        
    } catch (error) {
        console.error('Error in calculateMaterials:', error);
        document.getElementById('calculationResult').innerHTML = '<p class="error">計算中にエラーが発生しました</p>';
    }
}

// レシピを計算
function calculateRecipe() {
    try {
        const quantityInput = document.getElementById('quantity');
        const resultDiv = document.getElementById('calculationResult');
        
        if (!quantityInput || !resultDiv) {
            console.error('Calculator elements not found');
            return;
        }
        
        const quantity = parseInt(quantityInput.value) || 0;
        if (quantity <= 0) {
            resultDiv.innerHTML = '<p class="error">有効な個数を入力してください</p>';
            return;
        }
        
        // 選択されたレシピを取得
        const selectedRecipeName = getSelectValue('selectedRecipe');
        console.log('Selected recipe name:', selectedRecipeName);
        
        if (!selectedRecipeName) {
            resultDiv.innerHTML = '<p class="error">まずメインレシピを選択してください</p>';
            return;
        }

        const recipe = recipeDB.getRecipe(selectedRecipeName);
        if (!recipe) {
            resultDiv.innerHTML = '<p class="error">選択されたレシピが見つかりません</p>';
            return;
        }

        // 必要な材料を計算
        const expandedIngredients = recipeDB.expandIngredients(selectedRecipeName, quantity);        let resultHtml = `
            <div class="calculation-header">
                <h4>${recipe.name} ${quantity}個分の必要材料</h4>
                <div class="inventory-controls">
                    <button onclick="toggleAllInventoryCheckboxes(true)" class="control-btn">
                        <i class="fas fa-check-square"></i> 全選択
                    </button>
                    <button onclick="toggleAllInventoryCheckboxes(false)" class="control-btn">
                        <i class="fas fa-square"></i> 全解除
                    </button>
                </div>
            </div>
        `;
        resultHtml += '<div class="inventory-grid">';
        
        for (const [ingredient, amount] of Object.entries(expandedIngredients)) {
            const ingredientData = recipeDB.getRecipe(ingredient);
            const icon = ingredientData ? ingredientData.icon : 'fa-cube';
            const currentStock = recipeDB.getInventory(ingredient) || 0;
            const statusClass = currentStock >= amount ? 'sufficient' : 'insufficient';
            
            resultHtml += `
                <div class="inventory-card">
                    <div class="inventory-checkbox-container">
                        <input 
                            type="checkbox" 
                            id="checkbox-${ingredient}" 
                            class="inventory-checkbox" 
                            data-ingredient="${ingredient}"
                            onchange="updateInventoryCardColor('${ingredient}', this.checked)"
                        >
                        <label for="checkbox-${ingredient}" class="checkbox-label"></label>
                    </div>
                    <div class="ingredient-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="ingredient-name">${ingredient}</div>
                    <div class="ingredient-amount">${amount}</div>
                </div>
            `;
        }
        
        resultHtml += '</div>';
        
        console.log('Generated HTML with checkboxes:', resultHtml);
        resultDiv.innerHTML = resultHtml;
        
        // チェックボックスが正しく生成されているか確認
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.inventory-checkbox');
            const labels = document.querySelectorAll('.checkbox-label');
            console.log('Found checkboxes:', checkboxes.length);
            console.log('Found labels:', labels.length);
            console.log('Sample checkbox HTML:', checkboxes[0]?.outerHTML);
        }, 100);
        
    } catch (error) {
        console.error('Error in calculateRecipe:', error);
        const resultDiv = document.getElementById('calculationResult');
        if (resultDiv) {
            resultDiv.innerHTML = `<p class="error">計算エラー: ${error.message}</p>`;
        }
    }
}

// レシピを削除
function deleteRecipe(recipeName) {
    if (!recipeName) return;
    
    const recipe = recipeDB.getRecipe(recipeName);
    if (!recipe) {
        showNotification('レシピが見つかりません', 'error');
        return;
    }
    
    // 依存関係をチェック
    const dependentRecipes = [];
    recipeDB.getAllRecipes().forEach(r => {
        if (r.ingredients && r.ingredients[recipeName]) {
            dependentRecipes.push(r.name);
        }
    });
    
    let confirmMessage = `「${recipeName}」を削除しますか？\n\n`;
    
    if (dependentRecipes.length > 0) {
        confirmMessage += `警告: 以下のレシピがこの材料を使用しています:\n`;
        dependentRecipes.forEach(name => {
            confirmMessage += `- ${name}\n`;
        });
        confirmMessage += '\n削除すると、これらのレシピでエラーが発生する可能性があります。\n';
    }
    
    confirmMessage += '本当に削除しますか？';
    
    if (confirm(confirmMessage)) {
        try {
            recipeDB.deleteRecipe(recipeName);
            
            // メインレシピが削除された場合の処理
            if (recipeDB.currentMainRecipe === recipeName) {
                const mainRecipes = recipeDB.getMainRecipes();
                recipeDB.currentMainRecipe = mainRecipes.length > 0 ? mainRecipes[0].name : null;
            }
            
            // UIを更新
            updateAllUI();
            updateRecipeListDisplay();
            
            showNotification(`「${recipeName}」を削除しました`, 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('削除に失敗しました', 'error');
        }
    }
}

// 新しい材料を保存（モーダル用）
function saveNewIngredient() {
    const nameInput = document.getElementById('newIngredientName');
    const name = nameInput ? nameInput.value.trim() : '';
    
    // カスタムドロップダウンからアイコンを取得
    let icon = 'fa-utensils'; // デフォルト値
    const integration = window.dropdownIntegration || (typeof dropdownIntegration !== 'undefined' ? dropdownIntegration : null);
    if (integration) {
        const iconDropdown = integration.getDropdown('newIngredientIcon');
        if (iconDropdown && iconDropdown.getValue) {
            icon = iconDropdown.getValue() || 'fa-utensils';
        }
    } else {
        // フォールバック: 通常のselect要素
        const iconSelect = document.getElementById('newIngredientIcon');
        if (iconSelect) {
            icon = iconSelect.value || 'fa-utensils';
        }
    }
    
    
    if (!name) {
        alert('材料名を入力してください。');
        return;
    }
    
    // 既存の材料名と重複チェック
    if (recipeDB.getRecipe(name)) {
        alert(`「${name}」は既に存在します。`);
        return;
    }
    
    try {
        // 新しい基本材料を追加
        recipeDB.addItem(name, {
            icon: icon
        });
        
        // 現在編集中の選択要素に新しい材料を追加
        if (currentEditingSelect && integration) {
            // カスタムドロップダウンで適切なドロップダウンを探す
            let targetDropdown = null;
            for (const [key, dropdown] of integration.dropdowns) {
                if (dropdown.container === currentEditingSelect || 
                    dropdown.container.dataset.originalId === currentEditingSelect.id ||
                    dropdown.container.querySelector('select') === currentEditingSelect) {
                    targetDropdown = dropdown;
                    break;
                }
            }
            
            if (targetDropdown && targetDropdown.addOption) {
                // オプションを追加して選択
                targetDropdown.addOption(name, `${name} (基本材料)`);
                targetDropdown.setValue(name);
            }
        } else if (currentEditingSelect) {
            // フォールバック: 通常のselect要素
            const newOption = document.createElement('option');
            newOption.value = name;
            newOption.textContent = `${name} (基本材料)`;
            newOption.selected = true;
            
            // セパレーターの後に追加
            const separator = currentEditingSelect.querySelector('option[disabled]');
            if (separator && separator.nextSibling) {
                currentEditingSelect.insertBefore(newOption, separator.nextSibling);
            } else {
                currentEditingSelect.appendChild(newOption);
            }
        }
        
        // 他の材料選択欄も更新
        updateAllIngredientSelects();
        
        // モーダルを閉じる
        closeModalWithAnimation('addIngredientModal', () => {
            currentEditingSelect = null;
        });
        
        showNotification(`新しい材料「${name}」を追加しました`, 'success');
        
    } catch (error) {
        console.error('Error adding ingredient:', error);
        alert('材料の追加に失敗しました: ' + error.message);
    }
}
