# RecipeBox - アーキテクチャ概要

ビルドレスな **ES Modules** 構成。`index.html` は薄いシェル（ヘッダー + `#app`）で、
画面はすべて `js/app.js` が中央状態ストアを購読して描画する。

## レイヤー構成

```
┌──────────────────────────────────────────────────────────┐
│                        UI 層（views/）                     │
│  welcome / tree / materials / recipeForm / recipeList      │
│  + 共通: combobox, dialogs（modal/confirm/prompt/toast）    │
├──────────────────────────────────────────────────────────┤
│                    アプリ結線（app.js）                     │
│  状態購読 → 再描画 / ツールバー操作 / SW 登録               │
├──────────────────────────────────────────────────────────┤
│                     状態層（store.js）                      │
│  Store: recipes / inventory を保持・pub/sub・mutation       │
│  upsertRecipe / renameNode(カスケード) / deleteNode / …     │
├──────────────────────────────────────────────────────────┤
│   ロジック（recipe-logic.js）    永続化（persistence.js）    │
│   expand / dependencies /        localStorage / backup /    │
│   dependents / cycle 検出        import / export            │
├──────────────────────────────────────────────────────────┤
│                   スキーマ（schema.js）                     │
│         migrate(v1→v2) / normalize / buildExport            │
└──────────────────────────────────────────────────────────┘
```

## データフロー

```
ユーザー操作
   → view（イベント）
   → store の mutation（upsertRecipe / setInventory / renameNode ...）
   → store.emit()（購読者へ通知）
   → app.render()（構造再描画） + persistence（デバウンス保存）
```

在庫入力のような高頻度更新は `setInventory(..., { silent: true })` で全体再描画を
避け、カードをローカル更新しつつデバウンス保存する。

## データモデル

```js
// Node（基本材料 or レシピ）。名前キーで保持。
{
  name: "チーズパイ",
  type: "recipe",           // または "basic"
  baseQuantity: 1,
  ingredients: { "チーズ": 7, "卵": 3 },  // 材料名: 必要量
  icon: "fa-utensils",
  description: "",
  category: "default"
}
```

## 保存形式とマイグレーション

- 保存 key: `recipeDatabase`（旧来と同一 / 自動バックアップは `recipeBackup_*`）
- 形式: `{ schemaVersion: 2, app, exportedAt, recipes, inventory }`
- `schema.migrate()` が `schemaVersion` 欠如を **v1** と判定し、正規化してラップ。
  旧 localStorage・旧エクスポート JSON をそのまま読み込める（下位互換）。

## 主要機能

1. **材料計算エンジン**: `expandIngredients()` が基本材料まで再帰展開（各段 `Math.ceil`、
   `visited` Set で循環参照を検出）。
2. **依存ツリー**: `views/tree.js` が折りたたみ可能な木を再帰生成。
3. **在庫管理**: `views/materials.js` が必要量と手持ち在庫を並べ、充足状態と
   進捗を表示。
4. **改名カスケード**: `store.renameNode()` が全レシピの材料参照と在庫キーを移設。
5. **永続化**: 変更のデバウンス保存、5分間隔・`beforeunload` の自動保存、
   直近5件の自動バックアップ、JSON 入出力。

## 技術スタック

- **フロント**: Vanilla JS (ES Modules), HTML5, CSS3（ビルド不要）
- **デザイン**: CSS カスタムプロパティによるトークン設計、ライト/ダーク両対応
- **PWA**: Service Worker（HTML は network-first、資産は cache-first）
- **フォント/アイコン**: Poppins + Noto Sans JP / Font Awesome 6（CDN 非同期）
