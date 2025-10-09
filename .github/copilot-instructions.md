# レシピ管理システム - AI エージェント向け開発ガイド

## プロジェクト概要
複雑なレシピと材料の依存関係を管理するウェブアプリケーション。基本材料から複雑なレシピまで、階層構造での材料計算と在庫管理を提供。

## アーキテクチャの理解

### コアコンポーネント
- **RecipeDatabase** (`js/database.js`): データモデルとビジネスロジック
- **UI管理** (`js/ui-manager.js`): 表示状態制御とイベント処理
- **テーマ管理** (`js/theme-manager.js`): ライト/ダークテーマ切り替え
- **カスタムドロップダウン** (`js/custom-dropdown.js` + `js/dropdown-integration.js`): select要素の完全置換
- **ファイル管理** (`js/file-manager.js`): JSON インポート/エクスポート、自動バックアップ

### データ構造パターン
```javascript
// レシピは Map<string, Recipe> で管理
{
  name: "チーズパイ",
  type: "recipe", // または "basic"
  baseQuantity: 1,
  ingredients: { "チーズ": 7, "卵": 3 }, // 材料名: 必要量
  icon: "fa-utensils"
}
```

## 重要な設計原則

### 1. 再帰的材料展開システム
- `expandIngredients()` メソッドは循環参照検出付きで基本材料まで展開
- 必須: `visited` Set を使用した循環参照チェック実装

### 2. カスタムドロップダウンの統合
- **既存の select 要素は自動的にカスタムドロップダウンに変換される**
- DOM操作時: `getSelectValue()` / `setSelectValue()` ヘルパー関数を使用
- 新しい select 要素追加時は自動検出・変換される

### 3. UI状態管理
- `updateAllUI()` が全体の整合性を保つ - データ変更後は必ず呼び出す
- `isEmpty()` により表示状態（ウェルカム画面 vs メインUI）を制御

## 開発時のパターン

### DOM要素の値取得/設定
```javascript
// ❌ 直接的な操作（カスタムドロップダウンで動作しない）
document.getElementById('selectedRecipe').value = 'recipe1';

// ✅ 統一ヘルパー関数を使用
setSelectValue('selectedRecipe', 'recipe1');
const value = getSelectValue('selectedRecipe');
```

### レシピ操作の基本フロー
1. レシピデータ変更
2. `updateAllUI()` 呼び出し
3. `saveAllToLocalStorage()` で永続化（通常は updateAllUI 内で自動実行）

### エラーハンドリング
- `showNotification(message, type)` でユーザーフィードバック
- console.error でデバッグ情報出力
- try-catch で例外処理、特に JSON パース時

## CSS設計原則

### テーマシステム
- CSS カスタムプロパティ（`--primary-color` など）でテーマ管理
- `[data-theme="dark"]` セレクターでダークテーマ対応
- **select要素のスタイルは特に複雑** - 既存のカスタムプロパティを利用

### レスポンシブ設計
- モバイル: 768px 以下でレイアウト変更
- グリッドは `auto-fit` + `minmax()` パターン使用

## ファイル構成とモジュール依存関係

### 読み込み順序（重要）
```html
<!-- 1. テーマ管理 -->
<script src="js/theme-manager.js"></script>
<!-- 2. カスタムコンポーネント -->
<script src="js/custom-dropdown.js"></script>
<script src="js/dropdown-integration.js"></script>
<!-- 3. データ層 -->
<script src="js/database.js"></script>
<!-- 4. 機能層 -->
<script src="js/recipe-manager.js"></script>
<script src="js/ui-manager.js"></script>
<script src="js/inventory-manager.js"></script>
<script src="js/file-manager.js"></script>
<!-- 5. メインスクリプト -->
<script src="script.js"></script>
```

### グローバル変数
- `recipeDB`: RecipeDatabase インスタンス（メイン）
- `dropdownIntegration`: カスタムドロップダウン管理
- `themeManager`: テーマ切り替え管理

## よくある実装パターン

### 新しいモーダル追加
1. HTML に `modal` クラスで基本構造作成
2. `closeModalWithAnimation()` 使用でアニメーション付き閉じる処理
3. z-index: モーダル間の重なり制御（既存値を参考に）

### 材料/レシピ選択UI追加
- 自動的にカスタムドロップダウンに変換される
- `updateAllIngredientSelects()` で一括更新
- 新規追加機能は `enableAddNew()` で自動統合

### データ永続化
- LocalStorage への自動保存あり（5分間隔 + beforeunload）
- `createAutoBackup()` で自動バックアップ（最新5個保持）

## パフォーマンス考慮事項

### 大量データ対応
- レシピ100個以上でも動作するよう設計済み
- 仮想化: `updateRecipeListDisplay()` でグリッド表示最適化
- デバウンス: 検索・入力処理で使用

### メモリ管理
- カスタムドロップダウンは DOM 削除時に自動クリーンアップ
- Map データ構造でキー検索最適化

## デバッグとトラブルシューティング

### よくある問題
1. **select要素の値が取得できない** → `getSelectValue()` 使用確認
2. **レシピ追加後にUIが更新されない** → `updateAllUI()` 呼び出し確認
3. **カスタムドロップダウンが機能しない** → `dropdownIntegration` 初期化確認

### デバッグ用のコンソールコマンド
```javascript
// データベース状態確認
console.log(recipeDB.getAllRecipes());
// ドロップダウン状態確認
console.log(dropdownIntegration.dropdowns);
```

このシステムは複雑な材料依存関係と動的UI更新を中心に設計されています。既存パターンに従った開発を心がけてください。