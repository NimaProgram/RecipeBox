// カスタムドロップダウン統合システム
// 既存のselect要素をカスタムドロップダウンに置き換える

class DropdownIntegration {
    constructor() {
        this.dropdowns = new Map();
        this.originalSelectHandlers = new Map();
        this.init();
    }

    init() {
        // DOM読み込み完了後に既存のselect要素を変換
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.convertAllSelects();
            });
        } else {
            this.convertAllSelects();
        }
    }

    // 全てのselect要素をカスタムドロップダウンに変換
    convertAllSelects() {
        const selects = document.querySelectorAll('select');
        
        selects.forEach(select => {
            // 特定のクラスや属性で除外する場合
            if (select.classList.contains('keep-native') || select.hasAttribute('data-keep-native')) {
                return;
            }

            this.convertSelect(select);
        });
    }

    // 個別のselect要素を変換
    convertSelect(selectElement) {
        try {
            // 既に変換済みかチェック
            if (selectElement.style.display === 'none' || 
                selectElement.parentNode.querySelector('.custom-dropdown') ||
                selectElement.dataset.converted === 'true') {
                return;
            }
            
            // 変換中フラグを設定
            selectElement.dataset.converted = 'true';
            
            // 元のselect要素の情報を保存
            const selectId = selectElement.id;
            const selectName = selectElement.name;
            const selectClasses = selectElement.className;
            const isRequired = selectElement.required;
            
            // 親要素とコンテキストを特定
            const context = this.identifySelectContext(selectElement);
            
            // カスタムドロップダウンのオプションを設定
            const dropdownOptions = {
                placeholder: this.getPlaceholder(selectElement, context),
                size: this.getSize(selectElement, context),
                searchEnabled: context.enableSearch,
                addNewEnabled: context.enableAddNew
            };

            // 元のイベントハンドラーを保存
            this.saveOriginalHandlers(selectElement, selectId || this.generateId());

            // カスタムドロップダウンに変換
            const dropdown = convertSelectToCustomDropdown(selectElement, dropdownOptions);
            
            // IDとクラスを設定
            if (selectId) {
                dropdown.container.id = selectId + '_custom';
                dropdown.container.dataset.originalId = selectId;
            }
            if (selectName) {
                dropdown.container.dataset.name = selectName;
            }
            if (selectClasses) {
                dropdown.container.className += ' ' + selectClasses;
            }
            if (isRequired) {
                dropdown.container.dataset.required = 'true';
            }

            // コンテキスト固有の設定を適用
            this.applyContextSettings(dropdown, context);

            // ドロップダウンを登録
            const key = selectId || this.generateId();
            this.dropdowns.set(key, dropdown);

            console.log(`Select element converted to custom dropdown: ${key}`);
            
        } catch (error) {
            console.error('Error converting select element:', error, selectElement);
        }
    }

    // select要素のコンテキストを特定
    identifySelectContext(selectElement) {
        const context = {
            type: 'general',
            enableSearch: false,
            enableAddNew: false,
            placeholder: 'オプションを選択'
        };

        // 材料選択の場合
        if (selectElement.closest('.ingredient-entry')) {
            context.type = 'ingredient';
            context.enableSearch = true;
            context.enableAddNew = true;
            context.placeholder = '材料を選択...';
        }
        // レシピ選択の場合
        else if (selectElement.closest('.recipe-selector') || selectElement.closest('.main-recipe-selector')) {
            context.type = 'recipe';
            context.enableSearch = true;
            context.placeholder = 'レシピを選択...';
        }
        // フィルター用の場合
        else if (selectElement.closest('.recipe-filter')) {
            context.type = 'filter';
            context.placeholder = 'フィルター';
        }

        return context;
    }

    // プレースホルダーテキストを取得
    getPlaceholder(selectElement, context) {
        // data属性でプレースホルダーが指定されている場合
        if (selectElement.dataset.placeholder) {
            return selectElement.dataset.placeholder;
        }

        // 最初のoptionがプレースホルダーの場合
        const firstOption = selectElement.querySelector('option[value=""]');
        if (firstOption && firstOption.textContent.trim()) {
            return firstOption.textContent.trim();
        }

        return context.placeholder;
    }

    // サイズを決定
    getSize(selectElement, context) {
        if (context.type === 'ingredient') {
            return 'small';
        }
        return 'normal';
    }

    // 元のイベントハンドラーを保存
    saveOriginalHandlers(selectElement, key) {
        const handlers = {
            change: [],
            input: []
        };

        // onchangeイベントハンドラーを特定（グローバル関数）
        if (selectElement.onchange) {
            handlers.change.push(selectElement.onchange);
        }

        // 属性で指定されたハンドラーも保存
        const onchangeAttr = selectElement.getAttribute('onchange');
        if (onchangeAttr) {
            handlers.changeAttr = onchangeAttr;
        }

        this.originalSelectHandlers.set(key, handlers);
    }

    // コンテキスト固有の設定を適用
    applyContextSettings(dropdown, context) {
        // 検索機能を有効化
        if (context.enableSearch) {
            dropdown.enableSearch('検索...');
        }

        // 新規追加機能を有効化
        if (context.enableAddNew) {
            dropdown.enableAddNew('+ 新しい材料を追加', () => {
                this.handleAddNew(dropdown, context);
            });
        }

        // 選択時のハンドラーを設定
        dropdown.onSelect((value, text) => {
            this.handleSelection(dropdown, value, text, context);
        });
    }

    // 選択時の処理
    handleSelection(dropdown, value, text, context) {
        const key = this.getDropdownKey(dropdown);
        const handlers = this.originalSelectHandlers.get(key);

        // カスタムドロップダウンに元のselect要素の情報を設定
        dropdown.container.value = value;
        dropdown.container.selectedOptions = [{ textContent: text, value: value }];

        // 元のIDがある場合は、そのIDでアクセスできるよう偽のselect要素を作成
        const originalId = dropdown.container.dataset.originalId;
        if (originalId) {
            // 一時的に偽のselect要素を作成してDOMに追加
            const fakeSelect = document.createElement('select');
            fakeSelect.id = originalId;
            fakeSelect.value = value;
            fakeSelect.style.display = 'none';
            
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            option.selected = true;
            fakeSelect.appendChild(option);
            
            document.body.appendChild(fakeSelect);
            
            // タイムアウト後に削除
            setTimeout(() => {
                if (fakeSelect.parentNode) {
                    fakeSelect.parentNode.removeChild(fakeSelect);
                }
            }, 100);
        }

        if (handlers) {
            // 元のchangeハンドラーを実行
            handlers.change.forEach(handler => {
                if (typeof handler === 'function') {
                    handler.call(dropdown.container, { target: { value, textContent: text } });
                }
            });

            // 属性で指定されたハンドラーを実行
            if (handlers.changeAttr) {
                try {
                    // グローバル関数を実行（引数なしで）
                    const func = new Function(handlers.changeAttr);
                    func.call(dropdown.container);
                } catch (error) {
                    console.error('Error executing change handler:', error);
                }
            }
        }

        // コンテキスト固有の処理
        if (context.type === 'ingredient') {
            this.handleIngredientSelection(dropdown, value, text);
        } else if (context.type === 'recipe') {
            this.handleRecipeSelection(dropdown, value, text);
        }
    }

    // 材料選択時の処理
    handleIngredientSelection(dropdown, value, text) {
        // 既存のhandleIngredientChange関数があれば呼び出し
        if (typeof handleIngredientChange === 'function') {
            // より完全なselect要素のモックを作成
            const mockSelect = dropdown.container;
            mockSelect.value = value;
            mockSelect.textContent = text;
            mockSelect.selectedOptions = [{ textContent: text, value: value }];
            
            // 元のselect要素のように見えるプロパティを追加
            Object.defineProperty(mockSelect, 'options', {
                value: Array.from(dropdown.menu.querySelectorAll('.custom-dropdown-option')).map(opt => ({
                    value: opt.dataset.value,
                    textContent: opt.textContent,
                    selected: opt.classList.contains('selected')
                })),
                writable: false
            });
            
            handleIngredientChange(mockSelect);
        }
    }

    // レシピ選択時の処理
    handleRecipeSelection(dropdown, value, text) {
        // 既存のレシピ選択処理があれば呼び出し
        if (typeof onRecipeSelected === 'function') {
            // 引数なしで呼び出し（関数内でDOM要素を直接取得するため）
            onRecipeSelected();
        }
    }

    // 新規追加処理
    handleAddNew(dropdown, context) {
        console.log('handleAddNew called', context.type);
        if (context.type === 'ingredient') {
            // 材料追加ダイアログを表示
            if (typeof showAddIngredientDialog === 'function') {
                console.log('Calling showAddIngredientDialog');
                dropdown.close(); // ドロップダウンを閉じる
                showAddIngredientDialog(dropdown.container, dropdown.container.closest('.ingredient-entry'));
            } else {
                console.error('showAddIngredientDialog function not found');
            }
        }
    }

    // ドロップダウンのキーを取得
    getDropdownKey(dropdown) {
        return dropdown.container.dataset.originalId || dropdown.container.id || this.generateId();
    }

    // ユニークIDを生成
    generateId() {
        return 'dropdown_' + Math.random().toString(36).substr(2, 9);
    }

    // 特定のドロップダウンを取得
    getDropdown(id) {
        // 直接的なIDで検索
        let dropdown = this.dropdowns.get(id);
        if (dropdown) return dropdown;

        // カスタムドロップダウンのコンテナIDで検索
        dropdown = this.dropdowns.get(id + '_custom');
        if (dropdown) return dropdown;

        // data-original-id属性で検索
        for (const [key, dd] of this.dropdowns) {
            if (dd.container.dataset.originalId === id) {
                return dd;
            }
        }

        return null;
    }

    // 全てのドロップダウンを取得
    getAllDropdowns() {
        return Array.from(this.dropdowns.values());
    }

    // ドロップダウンの値を設定
    setDropdownValue(id, value) {
        const dropdown = this.dropdowns.get(id);
        if (dropdown) {
            dropdown.setValue(value);
        }
    }

    // ドロップダウンのオプションを更新
    updateDropdownOptions(id, options) {
        const dropdown = this.dropdowns.get(id);
        if (dropdown) {
            dropdown.setOptions(options);
        }
    }

    // 新しいselect要素が動的に追加された場合の処理
    observeNewSelects() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // NodeListを配列に変換
                        const selects = node.querySelectorAll ? Array.from(node.querySelectorAll('select')) : [];
                        
                        // ノード自体がselect要素の場合も追加
                        if (node.tagName === 'SELECT') {
                            selects.push(node);
                        }
                        
                        selects.forEach(select => {
                            if (!select.classList.contains('keep-native') && 
                                !select.hasAttribute('data-keep-native') &&
                                select.dataset.converted !== 'true' &&
                                select.style.display !== 'none') {
                                setTimeout(() => this.convertSelect(select), 10);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// グローバルインスタンスを作成
let dropdownIntegration;

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dropdownIntegration = new DropdownIntegration();
        dropdownIntegration.observeNewSelects();
    });
} else {
    dropdownIntegration = new DropdownIntegration();
    dropdownIntegration.observeNewSelects();
}

// グローバルに公開
window.dropdownIntegration = dropdownIntegration;
window.DropdownIntegration = DropdownIntegration;