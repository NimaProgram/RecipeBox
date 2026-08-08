# RecipeBox 🍳

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen)](https://nimaprogram.github.io/Recipebox/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](https://web.dev/progressive-web-apps/)

**複雑なレシピと材料の依存関係を効率的に管理する高機能レシピ管理システム**

RecipeBoxは、黒い砂漠やMMORPGのアイテム制作レシピにも対応し、100個以上のレシピと材料の自動計算を提供するモダンなウェブアプリケーションです。

## 🌟 主な機能

### 📊 自動材料計算
- 必要な材料を瞬時に算出
- 階層構造でのレシピ依存関係に対応
- 循環参照の自動検出と回避

### � ゲーム対応機能
- 黒い砂漠の料理レシピ・錬金術レシピに最適
- MMORPGのアイテム制作管理
- 複雑な材料チェーンの可視化
- ゲーム内経済計算サポート

### �🏗️ 階層レシピ管理
- 複雑な依存関係も簡単に管理
- 折りたたみ可能なツリー表示
- 材料から基本アイテムまでの完全展開

### 💾 データ保存・復元
- JSONフォーマットでの簡単バックアップ
- 自動保存機能（5分間隔）
- ローカルストレージへの永続化

### 🎨 モダンUI/UX
- ダークテーマ・ライトテーマ対応
- レスポンシブデザイン
- 固定ヘッダーによる快適な操作性
- カスタムドロップダウンメニュー

### 📱 PWA対応
- オフライン機能
- インストール可能
- モバイル最適化

## 🚀 デモ

[**👉 RecipeBoxを試してみる**](https://nimaprogram.github.io/Recipebox/)

## 📷 スクリーンショット

### メイン画面
- レシピ一覧とクイックアクション
- 統計情報の表示

### レシピ管理
- 直感的なレシピ作成・編集
- 材料の階層管理

### 黒い砂漠活用例
- 皇室料理レシピの材料計算
- 錬金術アイテムの制作管理
- 貿易品制作の効率化

## 🛠️ 技術スタック

- **フロントエンド**: Vanilla JavaScript, HTML5, CSS3
- **スタイリング**: CSS Custom Properties, CSS Grid, Flexbox
- **アーキテクチャ**: モジュラー設計、関心の分離
- **PWA**: Service Worker, Web App Manifest
- **データ管理**: LocalStorage, JSON

## 📁 プロジェクト構造

```
RecipeBox/
├── index.html              # アプリシェル（ヘッダー + #app）
├── styles.css              # デザインシステム（トークンベース）
├── manifest.json           # PWAマニフェスト
├── sw.js                   # Service Worker
├── sitemap.xml             # SEO用サイトマップ
├── robots.txt              # クローラー制御
├── favicon.svg             # アイコン
├── js/                     # ES Modules
│   ├── app.js              # エントリポイント（状態・永続化・描画の結線）
│   ├── store.js            # 中央状態ストア（pub/sub, mutation, 改名カスケード）
│   ├── recipe-logic.js     # 材料展開・依存解決（純粋関数）
│   ├── schema.js           # スキーマ定義 + マイグレーション（v1→v2）
│   ├── persistence.js      # localStorage 永続化・自動バックアップ・入出力
│   ├── combobox.js         # アクセシブルなコンボボックス
│   ├── dialogs.js          # モーダル・確認/入力ダイアログ・トースト
│   ├── dom.js              # 安全な DOM 生成ヘルパー（自動エスケープ）
│   ├── theme.js            # ライト/ダークテーマ管理
│   ├── icons.js            # アイコン候補
│   └── views/              # 画面部品
│       ├── welcome.js      # ウェルカム画面
│       ├── tree.js         # 依存ツリー（折りたたみ）
│       ├── materials.js    # 材料計算 + 在庫（have/need）
│       ├── recipeForm.js   # レシピ追加/編集モーダル
│       └── recipeList.js   # レシピ一覧モーダル
└── .github/
    └── copilot-instructions.md # AI開発ガイド
```

## 🎯 使用方法

### 基本的な使い方

1. **レシピ作成**
   ```
   1. 「レシピを作成」ボタンをクリック
   2. レシピ名と基本数量を入力
   3. 必要な材料と数量を追加
   4. 保存
   ```

2. **材料計算**
   ```
   1. 作りたいレシピを選択
   2. 作成数量を入力
   3. 必要材料が自動計算される
   ```

3. **黒い砂漠での活用例**
   ```
   1. 「皇室料理包み」レシピを作成
   2. 「オムレツ」「フルーツパイ」など中間材料を設定
   3. 「小麦」「卵」「牛乳」など基本材料まで展開
   4. 必要な材料数を一括計算
   ```

### 高度な機能

- **データエクスポート**: メニュー → エクスポート → JSON保存
- **データインポート**: メニュー → インポート → JSONファイル選択

## 🔧 開発者向け情報

### ローカル開発環境

```bash
# リポジトリをクローン
git clone https://github.com/NimaProgram/Recipebox.git
cd Recipebox

# ローカルサーバーで起動（例：Live Server）
# または任意のHTTPサーバーを使用
```

### アーキテクチャの理解

RecipeBoxは以下の設計原則に基づいています：

- **ESモジュール設計**: 機能ごとに分離された ES Modules（ビルドレス）
- **中央状態ストア**: `Store` が状態を保持し、`subscribe()` の pub/sub で UI を更新
- **再帰的材料展開**: 循環参照検出付きの安全な展開システム（純粋関数）
- **改名カスケード**: レシピ改名時に参照・在庫キーを自動移設して整合性を維持
- **下位互換**: `schemaVersion` とマイグレーション層で旧データを自動アップグレード
- **アクセシブルなコンポーネント**: 単一実装のコンボボックス／アプリ内ダイアログ

詳細な開発ガイドは [`.github/copilot-instructions.md`](.github/copilot-instructions.md) を参照してください。

## 📊 パフォーマンス

- **軽量**: バンドルサイズ < 500KB
- **高速**: 初期表示 < 1秒
- **効率**: 100個以上のレシピでもスムーズな動作

## 🔒 セキュリティ

- **データローカライゼーション**: すべてのデータはローカルに保存
- **XSS対策**: 適切なエスケープ処理
- **HTTPS**: GitHub Pagesによる安全な配信

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Font Awesome](https://fontawesome.com/) - アイコン
- [Google Fonts](https://fonts.google.com/) - フォント
- [GitHub Pages](https://pages.github.com/) - ホスティング

## 📈 今後の予定

- [ ] レシピ検索機能
- [ ] カテゴリ別分類
- [ ] レシピ共有機能
- [ ] 材料価格計算
- [ ] 多言語対応

---

<div align="center">

**Made with ❤️ by [NimaProgram](https://github.com/NimaProgram)**

[🌟 Star this repo](https://github.com/NimaProgram/Recipebox) if you find it helpful!

</div>
