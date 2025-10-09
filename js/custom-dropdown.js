// カスタムドロップダウンコンポーネント
class CustomDropdown {
    constructor(container) {
        this.container = container;
        this.button = container.querySelector('.custom-dropdown-button');
        this.menu = container.querySelector('.custom-dropdown-menu');
        this.arrow = container.querySelector('.custom-dropdown-arrow');
        this.options = [];
        this.selectedValue = '';
        this.selectedText = '';
        this.isOpen = false;
        this.searchEnabled = false;
        this.searchInput = null;
        this.onSelectCallback = null;
        this.onAddNewCallback = null;
        
        this.init();
    }

    init() {
        // ボタンクリックでドロップダウン開閉
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // キーボードサポート
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.open();
                this.focusFirstOption();
            }
        });

        // 外部クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });

        // Escキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.button.focus();
            }
        });
    }

    // オプションを設定
    setOptions(options) {
        this.options = options;
        this.renderOptions();
    }

    // 新しいオプションを追加
    addOption(value, text, icon = null) {
        const newOption = {
            value: value,
            text: text,
            icon: icon
        };
        this.options.push(newOption);
        this.renderOptions();
    }

    // オプションを追加
    addOption(value, text, disabled = false, icon = null) {
        this.options.push({ value, text, disabled, icon });
        this.renderOptions();
    }

    // オプションをクリア
    clearOptions() {
        this.options = [];
        this.renderOptions();
    }

    // オプションをレンダリング
    renderOptions() {
        // 既存のオプションをクリア（検索入力と新規追加ボタンは保持）
        const existingOptions = this.menu.querySelectorAll('.custom-dropdown-option:not(.custom-dropdown-add-new)');
        existingOptions.forEach(option => option.remove());

        // 検索入力がある場合、それより前に挿入
        const insertBefore = this.searchInput || this.menu.querySelector('.custom-dropdown-add-new') || null;

        this.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-dropdown-option';
            optionElement.dataset.value = option.value;
            optionElement.dataset.index = index;

            if (option.disabled) {
                optionElement.classList.add('disabled');
            }

            // アイコンがある場合は追加
            if (option.icon) {
                const iconElement = document.createElement('i');
                // Font Awesomeアイコンクラスを正しく設定
                let iconClass = option.icon;
                if (iconClass.startsWith('fa-') && !iconClass.includes('fas') && !iconClass.includes('far') && !iconClass.includes('fab')) {
                    iconClass = 'fas ' + iconClass;
                }
                iconElement.className = iconClass;
                iconElement.style.marginRight = '8px';
                optionElement.appendChild(iconElement);
            }

            const textNode = document.createTextNode(option.text);
            optionElement.appendChild(textNode);

            // クリックイベント
            if (!option.disabled) {
                optionElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectOption(option.value, option.text);
                });

                // キーボードナビゲーション
                optionElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.selectOption(option.value, option.text);
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.focusNextOption(optionElement);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.focusPreviousOption(optionElement);
                    }
                });

                optionElement.tabIndex = 0;
            }

            if (insertBefore) {
                this.menu.insertBefore(optionElement, insertBefore);
            } else {
                this.menu.appendChild(optionElement);
            }
        });
    }

    // 検索機能を有効化
    enableSearch(placeholder = '検索...') {
        if (this.searchEnabled) return;

        this.searchEnabled = true;
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'custom-dropdown-search';
        this.searchInput.placeholder = placeholder;

        this.searchInput.addEventListener('input', (e) => {
            this.filterOptions(e.target.value);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusFirstOption();
            } else if (e.key === 'Escape') {
                this.close();
                this.button.focus();
            }
        });

        this.menu.insertBefore(this.searchInput, this.menu.firstChild);
    }

    // 新規追加ボタンを追加
    enableAddNew(text = '+ 新しい項目を追加', callback = null) {
        // 既存の新規追加ボタンを削除
        const existingAddNew = this.menu.querySelector('.custom-dropdown-add-new');
        if (existingAddNew) {
            existingAddNew.remove();
        }

        const addNewElement = document.createElement('div');
        addNewElement.className = 'custom-dropdown-option custom-dropdown-add-new';
        addNewElement.innerHTML = `<i class="fas fa-plus"></i>${text}`;

        addNewElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Add new button clicked');
            this.close();
            if (this.onAddNewCallback) {
                console.log('Calling onAddNewCallback');
                this.onAddNewCallback();
            } else if (callback) {
                console.log('Calling callback');
                callback();
            }
        });

        // 配置位置を決定（disabledオプションの直後）
        const disabledOption = this.menu.querySelector('.custom-dropdown-option.disabled');
        const searchInput = this.menu.querySelector('.custom-dropdown-search');
        
        if (disabledOption) {
            // disabledオプションの直後に挿入
            if (disabledOption.nextSibling) {
                this.menu.insertBefore(addNewElement, disabledOption.nextSibling);
            } else {
                this.menu.appendChild(addNewElement);
            }
        } else if (searchInput) {
            // 検索入力の後に挿入
            if (searchInput.nextSibling) {
                this.menu.insertBefore(addNewElement, searchInput.nextSibling);
            } else {
                this.menu.appendChild(addNewElement);
            }
        } else {
            // 先頭に挿入
            const firstChild = this.menu.firstChild;
            if (firstChild) {
                this.menu.insertBefore(addNewElement, firstChild);
            } else {
                this.menu.appendChild(addNewElement);
            }
        }
        
        this.onAddNewCallback = callback;
    }

    // オプションをフィルタリング
    filterOptions(searchTerm) {
        const options = this.menu.querySelectorAll('.custom-dropdown-option:not(.custom-dropdown-add-new)');
        const term = searchTerm.toLowerCase();

        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(term)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    }

    // ドロップダウンを開く
    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.container.classList.add('open');
        this.button.classList.add('focused');

        // 検索入力がある場合はフォーカス
        if (this.searchInput) {
            setTimeout(() => {
                this.searchInput.focus();
                this.searchInput.value = '';
                this.filterOptions('');
            }, 100);
        }
    }

    // ドロップダウンを閉じる
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.container.classList.remove('open');
        this.button.classList.remove('focused');

        // 検索をクリア
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterOptions('');
        }
    }

    // ドロップダウンの開閉切り替え
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    // オプションを選択
    selectOption(value, text) {
        this.selectedValue = value;
        this.selectedText = text;

        // ボタンのテキストを更新
        const textElement = this.button.querySelector('.dropdown-text') || this.button.firstChild;
        if (textElement) {
            textElement.textContent = text;
        }

        // 選択状態を更新
        this.menu.querySelectorAll('.custom-dropdown-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.value === value) {
                option.classList.add('selected');
            }
        });

        this.close();

        // コールバック実行
        if (this.onSelectCallback) {
            this.onSelectCallback(value, text);
        }

        // イベント発火
        this.container.dispatchEvent(new CustomEvent('change', {
            detail: { value, text }
        }));
    }

    // 選択値を取得
    getValue() {
        return this.selectedValue || '';
    }

    // 選択テキストを取得
    getText() {
        return this.selectedText || '';
    }

    // select要素互換のプロパティを提供
    get value() {
        return this.getValue();
    }

    set value(val) {
        this.setValue(val);
    }

    // 選択値を設定
    setValue(value) {
        const option = this.options.find(opt => opt.value === value);
        if (option) {
            this.selectOption(option.value, option.text);
        }
    }

    // プレースホルダーを設定
    setPlaceholder(text) {
        const textElement = this.button.querySelector('.dropdown-text');
        if (textElement) {
            textElement.textContent = text;
            textElement.style.color = 'var(--text-muted)';
        }
    }

    // 選択時のコールバックを設定
    onSelect(callback) {
        this.onSelectCallback = callback;
    }

    // 新規追加時のコールバックを設定
    onAddNew(callback) {
        this.onAddNewCallback = callback;
    }

    // 最初のオプションにフォーカス
    focusFirstOption() {
        const firstOption = this.menu.querySelector('.custom-dropdown-option:not(.disabled):not([style*="display: none"])');
        if (firstOption) {
            firstOption.focus();
        }
    }

    // 次のオプションにフォーカス
    focusNextOption(currentOption) {
        const options = Array.from(this.menu.querySelectorAll('.custom-dropdown-option:not(.disabled):not([style*="display: none"])'));
        const currentIndex = options.indexOf(currentOption);
        const nextOption = options[currentIndex + 1] || options[0];
        if (nextOption) {
            nextOption.focus();
        }
    }

    // 前のオプションにフォーカス
    focusPreviousOption(currentOption) {
        const options = Array.from(this.menu.querySelectorAll('.custom-dropdown-option:not(.disabled):not([style*="display: none"])'));
        const currentIndex = options.indexOf(currentOption);
        const previousOption = options[currentIndex - 1] || options[options.length - 1];
        if (previousOption) {
            previousOption.focus();
        }
    }

    // ドロップダウンを破棄
    destroy() {
        // イベントリスナーの削除は自動的に行われる
        this.container.innerHTML = '';
    }
}

// ヘルパー関数：select要素をカスタムドロップダウンに変換
function convertSelectToCustomDropdown(selectElement, options = {}) {
    const container = document.createElement('div');
    container.className = 'custom-dropdown';
    
    // サイズクラスを追加
    if (options.size === 'small') {
        container.classList.add('small');
    }

    // ボタン要素を作成
    const button = document.createElement('div');
    button.className = 'custom-dropdown-button';
    button.tabIndex = 0;
    button.innerHTML = `
        <span class="dropdown-text">${options.placeholder || 'オプションを選択'}</span>
        <div class="custom-dropdown-arrow"></div>
    `;

    // メニュー要素を作成
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';

    container.appendChild(button);
    container.appendChild(menu);

    // 元のselect要素を置き換え
    selectElement.parentNode.replaceChild(container, selectElement);

    // カスタムドロップダウンを初期化
    const dropdown = new CustomDropdown(container);

    // 元のselect要素のoptionを移行
    const selectOptions = Array.from(selectElement.options).map(option => ({
        value: option.value,
        text: option.textContent,
        disabled: option.disabled,
        selected: option.selected
    }));

    dropdown.setOptions(selectOptions);

    // 選択済みの値を設定
    const selectedOption = selectOptions.find(opt => opt.selected);
    if (selectedOption) {
        dropdown.setValue(selectedOption.value);
    }

    return dropdown;
}

// グローバルに公開
window.CustomDropdown = CustomDropdown;
window.convertSelectToCustomDropdown = convertSelectToCustomDropdown;