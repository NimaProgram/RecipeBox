# RecipeBox - 機能概要

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                    RecipeBox System                     │
├─────────────────────────────────────────────────────────┤
│                   Frontend Layer                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   UI Components │  Theme System   │   PWA Features      │
│                 │                 │                     │
│ • Fixed Header  │ • Light Theme   │ • Service Worker    │
│ • Modal System  │ • Dark Theme    │ • Offline Support   │
│ • Custom Dropdown│ • CSS Variables│ • Install Prompt    │
│ • Recipe Cards  │ • Auto Switch   │ • Cache Strategy    │
│ • Inventory Grid│                 │                     │
├─────────────────┼─────────────────┼─────────────────────┤
│                 │                 │                     │
│  Business Logic │  Data Management │  File Operations    │
│                 │                 │                     │
│ • Recipe Calculator • Recipe Database • JSON Export     │
│ • Inventory Manager • LocalStorage   • Auto Backup     │
│ • Dependency Resolver • State Management • Import/Export │
│ • Circular Detection  • Event System    • Data Validation│
└─────────────────┴─────────────────┴─────────────────────┘
```

## データフロー

```
User Input
    ↓
UI Components (index.html)
    ↓
Event Handlers (script.js)
    ↓
Business Logic Modules (js/*.js)
    ↓
Data Layer (database.js)
    ↓
Storage (LocalStorage)
    ↓
UI Update (ui-manager.js)
    ↓
Visual Feedback
```

## モジュール依存関係

```
script.js
├── theme-manager.js
├── custom-dropdown.js
├── dropdown-integration.js
├── database.js
│   └── (core data operations)
├── recipe-manager.js
│   ├── database.js
│   └── ui-manager.js
├── ui-manager.js
│   ├── database.js
│   └── inventory-manager.js
├── inventory-manager.js
│   ├── database.js
│   └── ui-manager.js
└── file-manager.js
    ├── database.js
    └── ui-manager.js
```

## 主要機能マップ

### 1. レシピ管理システム
- **作成**: 新規レシピの追加
- **編集**: 既存レシピの修正
- **削除**: レシピの除去
- **複製**: レシピのコピー作成

### 2. 材料計算エンジン
- **階層展開**: ネストされたレシピの材料計算
- **循環検出**: 無限ループの防止
- **数量計算**: 倍率による材料量調整
- **依存解決**: 複雑な材料依存関係の処理

### 3. 在庫管理システム
- **在庫追跡**: 現在の材料在庫量
- **不足検出**: 必要量との比較
- **チェックリスト**: 調達状況の視覚管理
- **ステータス表示**: 充足/不足の色分け

### 4. データ永続化
- **自動保存**: 5分間隔での保存
- **手動保存**: ユーザー操作での即座保存
- **バックアップ**: 自動バックアップ機能
- **復元**: データ復旧機能

### 5. UI/UX システム
- **レスポンシブ**: 全デバイス対応
- **テーマ**: ライト/ダーク切り替え
- **アニメーション**: スムーズな操作感
- **アクセシビリティ**: 使いやすさの配慮

## 技術スタック詳細

### Frontend
- **HTML5**: セマンティックマークアップ
- **CSS3**: Grid, Flexbox, Custom Properties
- **JavaScript (ES6+)**: モジュラー設計
- **PWA**: Service Worker, Manifest

### Design System
- **色体系**: CSS Custom Properties
- **タイポグラフィ**: Google Fonts (Poppins)
- **アイコン**: Font Awesome 6
- **レイアウト**: CSS Grid + Flexbox

### Storage & Performance
- **LocalStorage**: クライアントサイド永続化
- **JSON**: データ交換フォーマット
- **キャッシュ**: Service Worker活用
- **最適化**: 軽量設計、遅延読み込み