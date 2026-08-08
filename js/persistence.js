// persistence.js — localStorage 永続化・自動バックアップ・ファイル入出力
//
// 既存ユーザーのデータを見失わないため、localStorage キーは旧来のものを維持する。

import { migrate } from './schema.js';

const STORAGE_KEY = 'recipeDatabase';
const BACKUP_PREFIX = 'recipeBackup_';
const MAX_BACKUPS = 5;
const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * ストアと localStorage を結線し、自動保存・自動バックアップを開始する。
 * @param {import('./store.js').Store} store
 */
export function initPersistence(store) {
    // 起動時ロード（旧 v1 データは migrate() で自動アップグレード）
    loadFromLocalStorage(store);

    // 変更時にデバウンス保存
    let saveTimer = null;
    store.subscribe(() => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveToLocalStorage(store), 400);
    });

    // 退出時に確実に保存＋バックアップ
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage(store);
        createAutoBackup(store);
    });

    // 定期自動保存＋バックアップ
    setInterval(() => {
        saveToLocalStorage(store);
        createAutoBackup(store);
    }, AUTOSAVE_INTERVAL_MS);
}

export function loadFromLocalStorage(store) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        store.load(raw); // migrate() を内包
        return true;
    } catch (err) {
        console.error('localStorage 読み込みエラー:', err);
        return false;
    }
}

export function saveToLocalStorage(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store.toJSON()));
    } catch (err) {
        console.error('localStorage 保存エラー:', err);
    }
}

// --- 自動バックアップ -----------------------------------------------------

export function createAutoBackup(store) {
    try {
        if (store.isEmpty()) return;
        localStorage.setItem(`${BACKUP_PREFIX}${Date.now()}`, JSON.stringify(store.toJSON()));
        pruneBackups();
    } catch (err) {
        console.error('自動バックアップエラー:', err);
    }
}

function pruneBackups() {
    const keys = listBackupKeys();
    if (keys.length > MAX_BACKUPS) {
        // 昇順ソート → 古いものから削除
        keys.sort().slice(0, keys.length - MAX_BACKUPS).forEach(k => localStorage.removeItem(k));
    }
}

export function listBackupKeys() {
    return Object.keys(localStorage).filter(k => k.startsWith(BACKUP_PREFIX));
}

/** バックアップ一覧を新しい順に {key, date} で返す */
export function listBackups() {
    return listBackupKeys()
        .map(key => ({ key, timestamp: parseInt(key.slice(BACKUP_PREFIX.length), 10) }))
        .filter(b => !Number.isNaN(b.timestamp))
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(b => ({ key: b.key, date: new Date(b.timestamp) }));
}

export function restoreBackup(store, key) {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('バックアップが見つかりません');
    store.load(raw);
}

export function clearAllStorage(store) {
    Object.keys(localStorage).forEach(key => {
        if (key === STORAGE_KEY || key.startsWith(BACKUP_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    store.clear();
}

// --- ファイル入出力 -------------------------------------------------------

function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportToFile(store) {
    downloadJSON(store.toJSON(), 'recipe-data.json');
}

export function createBackupFile(store) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadJSON(store.toJSON(), `recipe-backup-${stamp}.json`);
}

/**
 * ファイル選択ダイアログを開き、選ばれた JSON を取り込む。
 * @returns {Promise<boolean>} 取り込めたら true、キャンセルなら false
 */
export function importFromFile(store) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return resolve(false);
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    store.load(reader.result); // migrate() を内包
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました'));
            reader.readAsText(file);
        });
        input.click();
    });
}
