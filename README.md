# RecipeBox 🍳

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen)](https://nimaprogram.github.io/Recipebox/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](https://web.dev/progressive-web-apps/)

**複雑なレシピと材料の依存関係を効率的に管理する高機能レシピ管理システム**

RecipeBoxは、100個以上のレシピにも対応し、材料の自動計算を提供するモダンなウェブアプリケーションです。

## 🌟 主な機能

### 📊 自動材料計算
- 必要な材料を瞬時に算出
- 階層構造でのレシピ依存関係に対応
- 循環参照の自動検出と回避

### 🏗️ 階層レシピ管理
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

## 🛠️ 技術スタック

- **フロントエンド**: Vanilla JavaScript, HTML5, CSS3
- **スタイリング**: CSS Custom Properties, CSS Grid, Flexbox
- **アーキテクチャ**: モジュラー設計、関心の分離
- **PWA**: Service Worker, Web App Manifest
- **データ管理**: LocalStorage, JSON

## 📁 プロジェクト構造

```
RecipeBox/
├── index.html              # メインHTML
├── styles.css              # メインスタイルシート
├── script.js               # メインJavaScript
├── manifest.json           # PWAマニフェスト
├── sw.js                   # Service Worker
├── sitemap.xml             # SEO用サイトマップ
├── robots.txt              # クローラー制御
├── favicon.svg             # アイコン
├── js/                     # JavaScriptモジュール
│   ├── database.js         # データベース管理
│   ├── ui-manager.js       # UI状態管理
│   ├── recipe-manager.js   # レシピ操作
│   ├── inventory-manager.js # 材料計算管理
│   ├── file-manager.js     # ファイル操作
│   ├── theme-manager.js    # テーマ切り替え
│   ├── custom-dropdown.js  # カスタムドロップダウン
│   └── dropdown-integration.js # ドロップダウン統合
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

- **モジュラー設計**: 機能ごとに分離されたJavaScriptモジュール
- **再帰的材料展開**: 循環参照検出付きの安全な展開システム
- **統一UI管理**: `updateAllUI()`による一貫した状態管理
- **カスタムコンポーネント**: 完全にカスタマイズされたドロップダウンメニュー

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
