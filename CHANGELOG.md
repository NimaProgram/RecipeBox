# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-10

### Added
- 🎉 初回リリース
- 📊 自動材料計算システム
- 🏗️ 階層レシピ管理（折りたたみ対応）
- 💾 JSONデータ保存・復元機能
- 🎨 ダークテーマ・ライトテーマ切り替え
- 📱 PWA対応（オフライン機能）
- 🖥️ 固定ヘッダーレイアウト
- 🎛️ カスタムドロップダウンメニュー
- 🔍 SEO最適化
- 🚀 GitHub Pages デプロイ

### Technical Features
- モジュラーJavaScriptアーキテクチャ
- 循環参照検出システム
- レスポンシブデザイン
- Service Worker実装
- 構造化データ（JSON-LD）
- サイトマップ・robots.txt

### UI/UX Improvements
- 直感的なレシピ作成フロー
- リアルタイム材料計算
- スムーズなアニメーション
- モーダル管理システム
- z-index階層の最適化

## [Unreleased]

### Changed - 全面リファクタリング + デザイン刷新
- 🏗️ アーキテクチャを ES Modules 構成へ再設計（グローバル関数の集合を廃止し、中央状態ストア `Store` + pub/sub へ）
- 🎨 デザインシステムを刷新（CSS をトークンベースで再構築、クリーンで余白の効いた UI・ライト/ダーク両対応）
- 🧩 脆弱なカスタムドロップダウン層（偽 select / MutationObserver / setTimeout 競合）を単一のアクセシブルなコンボボックスに置換
- 💾 保存形式に `schemaVersion` を導入し、旧データ（v1）を自動アップグレードするマイグレーション層を追加（下位互換）
- ✏️ レシピ改名を「改名カスケード」化（全材料参照・在庫キーを自動移設し参照破綻を解消）
- 🧮 計算結果と在庫（have/need）を1画面に統合、充足プログレス表示を追加
- 💬 `prompt()`/`alert()`/`confirm()` をアプリ内ダイアログ・トーストへ置換

### Fixed
- 🐛 存在しないメソッド参照（`setCurrentMainRecipe` 等）によるレシピ選択・削除・編集の破綻
- 🐛 バックアップ書き出し時にオブジェクトをそのまま `Blob` 化していた不具合（`[object Object]`）
- 🔒 レシピ名を `innerHTML` へ直挿ししていた XSS リスク（DOM 生成 + エスケープで根絶）

### Planned Features
- カテゴリ別分類
- レシピ共有機能
- 材料価格計算
- 多言語対応

---

## Version History

- **v1.0.0** - Production ready release with full feature set
- **v0.9.x** - Beta releases with core functionality
- **v0.1.x** - Initial development and prototyping