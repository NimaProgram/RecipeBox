# Contributing to RecipeBox 🤝

RecipeBoxへのコントリビューションをありがとうございます！このガイドは、プロジェクトに貢献する方法について説明します。

## 🚀 はじめに

### 開発環境の準備

1. **リポジトリをフォーク**
   ```bash
   # GitHubでフォークボタンをクリック
   ```

2. **ローカルにクローン**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Recipebox.git
   cd Recipebox
   ```

3. **アップストリームを設定**
   ```bash
   git remote add upstream https://github.com/NimaProgram/Recipebox.git
   ```

4. **ローカルサーバーで起動**
   - Live Serverや任意のHTTPサーバーを使用
   - `index.html`をブラウザで開く

## 📋 コントリビューションのタイプ

### 🐛 バグ修正
- 問題を再現できることを確認
- 修正内容を明確に説明
- テストケースの追加を推奨

### ✨ 新機能
- Issue で事前に議論することを推奨
- 既存のアーキテクチャとの整合性を保つ
- ドキュメントの更新も含める

### 📚 ドキュメント改善
- 分かりやすい説明への改善
- コード例の追加
- 翻訳の改善

### 🎨 UI/UX改善
- レスポンシブデザインの維持
- アクセシビリティの考慮
- テーマシステムとの互換性

## 🏗️ 開発ガイドライン

### コーディング規約

1. **JavaScript**
   ```javascript
   // ✅ Good
   function calculateMaterials(recipeName, quantity) {
       try {
           // 実装
       } catch (error) {
           console.error('Error in calculateMaterials:', error);
       }
   }
   
   // ❌ Bad
   function calc(r,q){
       // 実装
   }
   ```

2. **CSS**
   ```css
   /* ✅ Good - カスタムプロパティを使用 */
   .button {
       background: var(--primary-color);
       border-radius: 8px;
   }
   
   /* ❌ Bad - ハードコードされた値 */
   .button {
       background: #4a90e2;
   }
   ```

3. **HTML**
   ```html
   <!-- ✅ Good - セマンティックHTML -->
   <section class="recipe-section">
       <h2>レシピ一覧</h2>
   </section>
   
   <!-- ❌ Bad -->
   <div class="recipe-thing">
       <div>レシピ一覧</div>
   </div>
   ```

### アーキテクチャの原則

1. **モジュラー設計**
   - 機能ごとにファイルを分離
   - 責任の明確な分離
   - 再利用可能なコンポーネント

2. **エラーハンドリング**
   ```javascript
   // 必須: try-catch での例外処理
   try {
       // 危険な操作
   } catch (error) {
       console.error('Error:', error);
       showNotification('エラーが発生しました', 'error');
   }
   ```

3. **UI状態管理**
   ```javascript
   // データ変更後は必ず実行
   updateAllUI();
   ```

## 🔧 重要な技術的考慮事項

### カスタムドロップダウンシステム
```javascript
// ✅ 正しい方法
const value = getSelectValue('elementId');
setSelectValue('elementId', 'value');

// ❌ 間違った方法
document.getElementById('elementId').value = 'value';
```

### レシピ依存関係の処理
```javascript
// 循環参照検出が必須
function expandIngredients(recipeName, quantity, visited = new Set()) {
    if (visited.has(recipeName)) {
        throw new Error(`循環参照検出: ${recipeName}`);
    }
    visited.add(recipeName);
    // 処理続行
}
```

## 📝 プルリクエストの手順

### 1. ブランチ作成
```bash
git checkout -b feature/amazing-feature
# または
git checkout -b fix/bug-description
```

### 2. 変更の実装
- 小さく、焦点を絞った変更を心がける
- コミットメッセージは明確に記述

### 3. テスト
- ブラウザでの動作確認
- 異なるテーマでの表示確認
- レスポンシブデザインの確認

### 4. コミット
```bash
git add .
git commit -m "feat: 新機能の説明"
# または
git commit -m "fix: バグ修正の説明"
```

### 5. プッシュとPR作成
```bash
git push origin feature/amazing-feature
```

## 📋 プルリクエストチェックリスト

- [ ] 変更内容が明確に説明されている
- [ ] 関連するIssueがリンクされている
- [ ] ブラウザでの動作確認済み
- [ ] コードスタイルガイドに準拠
- [ ] ドキュメントが更新されている（必要に応じて）
- [ ] テーマ切り替えでの表示確認済み
- [ ] モバイル表示の確認済み

## 🐛 バグレポート

### Issue作成時の情報
- **環境情報**: ブラウザ、OS、バージョン
- **再現手順**: 具体的なステップ
- **期待される動作**: 本来の動作
- **実際の動作**: 発生している問題
- **スクリーンショット**: 可能であれば添付

### テンプレート例
```markdown
## 環境
- ブラウザ: Chrome 118.0
- OS: Windows 11
- URL: https://nimaprogram.github.io/Recipebox/

## 再現手順
1. レシピ管理を開く
2. 新しいレシピを作成
3. ...

## 期待される動作
レシピが正常に保存される

## 実際の動作
エラーメッセージが表示される
```

## 🎯 優先度の高い貢献領域

1. **アクセシビリティ改善**
   - スクリーンリーダー対応
   - キーボードナビゲーション
   - 色覚異常への配慮

2. **パフォーマンス最適化**
   - 大量データでの動作改善
   - 読み込み速度の向上
   - メモリ使用量の削減

3. **ユーザビリティ向上**
   - エラーメッセージの改善
   - 操作フローの簡素化
   - ヘルプ機能の追加

## 📞 質問・サポート

- **GitHub Discussions**: 一般的な質問
- **GitHub Issues**: バグレポート・機能要求
- **開発ガイド**: `.github/copilot-instructions.md`

## 🙏 謝辞

すべてのコントリビューターに感謝します！あなたの貢献がRecipeBoxをより良いプロジェクトにします。

---

Happy coding! 🚀