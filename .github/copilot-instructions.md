# RecipeBox - AI エージェント向け開発ガイド

複雑なレシピと材料の依存関係を管理するビルドレスな Web アプリ（PWA）。
基本材料から複雑なレシピまで、階層構造での材料計算を提供する。

## アーキテクチャ（ES Modules）

ビルド不要。`index.html`（薄いシェル）→ `js/app.js`（エントリ）が
中央状態ストアを購読して画面を描画する。

### コアモジュール
- **Store** (`js/store.js`): 状態（recipes / inventory）と pub/sub、mutation。
- **ロジック** (`js/recipe-logic.js`): `expandIngredients` / `getDependencies` /
  `getDependents` / `wouldCreateCycle`（純粋関数、副作用なし）。
- **スキーマ** (`js/schema.js`): `migrate()`（v1→v2）/ `normalize` / `buildExport`。
- **永続化** (`js/persistence.js`): localStorage・自動バックアップ・入出力。
- **UI 基盤**: `js/dom.js`（`el()` で安全に DOM 生成）、`js/dialogs.js`
  （modal/confirm/prompt/toast）、`js/combobox.js`（コンボボックス）、`js/theme.js`。
- **画面** (`js/views/*`): welcome / tree / materials / recipeForm / recipeList。

### データモデル
```js
{ name, type: "basic"|"recipe", baseQuantity, ingredients: { 名前: 量 }, icon, description, category }
```
recipes は「名前キー」の `Map` で保持。

## 重要な設計原則

### 1. 状態は Store 経由でのみ変更する
- 読み取り: `store.getRecipe(name)` / `getAllRecipes()` / `getRecipesWithIngredients()` / `expand()` など。
- 変更: `upsertRecipe()` / `deleteNode()` / `renameNode()` / `setInventory()`。
- 変更後は `store.emit()` が購読者へ通知（mutation 内で自動）。UI 側は `store.subscribe()` で再描画。
- 高頻度更新（在庫入力など）は `setInventory(name, q, { silent: true })` + デバウンス保存で全体再描画を避ける。

### 2. 改名は renameNode を使う（参照破綻を防ぐ）
- レシピ/材料の名前変更は必ず `store.renameNode(old, new)`。全材料参照と在庫キーを自動移設する。

### 3. 再帰的材料展開と循環参照
- `expandIngredients()` は基本材料まで展開し、各段で `Math.ceil` 切り上げ、`visited` Set で循環を検出。
- レシピフォームでは `store.wouldCycle(recipeName, ingredient)` で循環を事前に拒否する。

### 4. DOM は安全に生成する（XSS 対策）
- `innerHTML` 文字列連結は使わない。`el(tag, props, children)` と `textContent` で組み立てる。
- 外部/ユーザー入力を HTML として挿入しない。アイコン等の静的構造のみ `icon()` を使う。

### 5. ダイアログ / 通知
- `prompt`/`alert`/`confirm` は使わない。`dialogs.js` の
  `openModal` / `confirmDialog` / `promptDialog` / `notify` を使う。

## 下位互換（重要）
- localStorage key は `recipeDatabase`（バックアップ `recipeBackup_*`）を維持。
- 読み込み・インポートは必ず `schema.migrate()` を通す（`store.load()` が内包）。
- 保存形式を変える場合は `CURRENT_SCHEMA` を上げ、`migrate()` に変換段を追加する。

## CSS（デザインシステム）
- `styles.css` はトークン（`:root` と `:root[data-theme="dark"]`）→ base → components の順。
- 色・間隔・角丸・影・タイポはすべて CSS 変数。新規コンポーネントも変数を使う。
- レスポンシブ: 860px でワークスペースを1カラム、560px 以下でモバイル最適化。

## PWA
- `sw.js`: HTML は network-first、その他資産は cache-first。
- 資産を追加/リネームしたら `CORE_ASSETS` と `CACHE_NAME` を更新する。

## よくある作業
- **画面部品を追加**: `js/views/` に要素を返す関数を作り、`app.js` から組み込む。
- **モーダルを追加**: `openModal({ title, body, actions })` を使う（独自 DOM を作らない）。
- **選択 UI を追加**: `createCombobox({ options, searchable, allowAdd, onSelect, onAdd })`。
