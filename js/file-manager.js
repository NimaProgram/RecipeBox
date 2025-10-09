// ファイル操作関連の関数

// データを保存
function exportToFile() {
    try {
        const data = JSON.stringify(recipeDB.toJSON(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipe-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('データを保存しました', 'success');
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification(`保存エラー: ${error.message}`, 'error');
    }
}

// データを読み込み
function importFromFile() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonText = e.target.result;
                    const data = JSON.parse(jsonText);
                    recipeDB.fromJSON(data);
                    updateAllUI();
                    showNotification('データを読み込みました', 'success');
                } catch (error) {
                    console.error('Error loading data:', error);
                    showNotification(`読み込みエラー: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    } catch (error) {
        console.error('Error in loadData:', error);
        showNotification(`ファイル操作エラー: ${error.message}`, 'error');
    }
}

// バックアップを作成
function createBackup() {
    try {
        const data = recipeDB.toJSON();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipe-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('バックアップを作成しました', 'success');
    } catch (error) {
        console.error('Error creating backup:', error);
        showNotification(`バックアップエラー: ${error.message}`, 'error');
    }
}

// LocalStorageにすべてのデータを保存
function saveAllToLocalStorage() {
    try {
        const data = recipeDB.toJSON();
        localStorage.setItem('recipeDatabase', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// LocalStorageからデータを読み込み
function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('recipeDatabase');
        if (data) {
            const parsedData = JSON.parse(data);
            recipeDB.fromJSON(parsedData);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return false;
    }
}

// LocalStorageを完全にクリア
function clearAllLocalStorage() {
    if (confirm('すべてのレシピデータと在庫データ、バックアップを完全に削除しますか？\n\nこの操作は取り消せません。')) {
        try {
            // すべてのレシピ関連データを削除
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key === 'recipeDatabase' || key.startsWith('recipeBackup_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // データベースを再初期化
            recipeDB = new RecipeDatabase();
            updateAllUI();
            
            showNotification('すべてのデータを削除しました', 'success');
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            showNotification('データ削除に失敗しました', 'error');
        }
    }
}

// バックアップ一覧を表示
function showBackupList() {
    const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('recipeBackup_'))
        .sort()
        .reverse();
    
    if (keys.length === 0) {
        showNotification('利用可能なバックアップがありません', 'info');
        return;
    }
    
    let message = '復元したいバックアップを選択してください:\n\n';
    keys.forEach((key, index) => {
        const timestamp = parseInt(key.replace('recipeBackup_', ''));
        const date = new Date(timestamp);
        message += `${index + 1}. ${date.toLocaleString('ja-JP')}\n`;
    });
    
    const choice = prompt(message + '\n番号を入力してください (キャンセルで中止):');
    const choiceNum = parseInt(choice);
    
    if (choiceNum >= 1 && choiceNum <= keys.length) {
        const selectedKey = keys[choiceNum - 1];
        try {
            const jsonString = localStorage.getItem(selectedKey);
            const data = JSON.parse(jsonString);
            recipeDB.fromJSON(data);
            updateAllUI();
            showNotification('バックアップから復元しました', 'success');
        } catch (error) {
            console.error('Error restoring backup:', error);
            showNotification('バックアップの復元に失敗しました', 'error');
        }
    }
}

// 通知を表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // スタイルを適用
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1400;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // タイプ別の色設定
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    // アニメーション
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // 自動削除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 自動バックアップ機能
function createAutoBackup() {
    try {
        const data = recipeDB.toJSON();
        const jsonString = JSON.stringify(data);
        const timestamp = Date.now();
        
        localStorage.setItem(`recipeBackup_${timestamp}`, jsonString);
        
        // 古いバックアップを削除（最新5個まで保持）
        const keys = Object.keys(localStorage).filter(key => key.startsWith('recipeBackup_'));
        if (keys.length > 5) {
            keys.sort().slice(0, keys.length - 5).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    } catch (error) {
        console.error('Auto backup error:', error);
    }
}

// ページ退出時にデータを保存
window.addEventListener('beforeunload', () => {
    saveAllToLocalStorage();
    createAutoBackup();
});

// 定期的な自動保存（5分間隔）
setInterval(() => {
    saveAllToLocalStorage();
    createAutoBackup();
}, 5 * 60 * 1000);