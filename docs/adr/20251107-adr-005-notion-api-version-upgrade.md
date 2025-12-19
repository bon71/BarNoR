# 005. Notion API バージョン 2025-09-03 へのアップグレード

**日付**: 2025-11-07

**ステータス**: 承認済み

---

## コンテキスト（Context）

### 背景

NotionBarcodeReaderアプリケーションでは、Notion APIを使用してバーコードスキャン結果をNotionデータベースに保存する機能を提供しています。これまでは Notion API version 2022-06-28 を使用していましたが、以下の理由からアップグレードが必要となりました：

- **Notion API 2025-09-03の公開**: 新しいAPIバージョンがリリースされ、マルチソースデータベース対応などの重要な機能が追加された
- **将来の互換性**: 古いAPIバージョンのサポート終了リスクへの対応
- **新機能への対応**: データソース（data_source）の概念が導入され、より柔軟なデータベース管理が可能に
- **ClaudeCode全体での標準化**: 全プロジェクトで最新のNotion APIバージョンを使用する統一ルールの確立

### 現在の状況

- NotionAPI.ts で API version 2022-06-28 を使用
- シングルソースデータベースのみを想定した実装
- 検索APIで `object: 'database'` フィルターを使用
- データベース操作は database_id ベースのみ

### 制約条件

- **互換性維持**: 既存のユーザーデータとの互換性を保つ必要がある
- **段階的移行**: 破壊的変更を避け、スムーズな移行を実現
- **後方互換性**: 2025-09-03では既存のdatabase_idベースのAPIも引き続き動作するため、段階的な対応が可能
- **テスト環境の制約**: 本番Notionデータベースでのテストが必要

---

## 決定（Decision）

### 採用するアプローチ

Notion API version 2025-09-03 にアップグレードし、データソース（data_source）の概念に対応した実装に移行する。

**具体的な変更内容**:

1. **APIバージョンの更新**
   - NotionAPI.ts のデフォルトバージョンを `2025-09-03` に変更
   - `Notion-Version` ヘッダーで新バージョンを指定

2. **検索APIの更新**
   - フィルター値を `'database'` から `'data_source'` に変更
   - レスポンス型に `NotionDataSourceResponse` を追加

3. **レスポンス処理の拡張**
   - `NotionSearchResponse` が `database` と `data_source` の両方を処理可能に
   - NotionRepository.listDatabases() で両形式のレスポンスを適切にマッピング

4. **ClaudeCodeルールの追加**
   - `/Users/bon/dev/CLAUDE.md` に Notion API バージョン規則を追加
   - 全プロジェクトで `2025-09-03` を標準として使用

### 理由

- **公式推奨**: Notion公式ドキュメントで最新バージョンの使用が推奨されている
- **マルチソース対応**: 将来的にマルチソースデータベースに対応する準備
- **後方互換性**: 既存のdatabase_idベースのAPIも動作するため、リスクが低い
- **標準化**: ClaudeCodeプロジェクト全体で統一されたAPIバージョンを使用
- **長期サポート**: 最新バージョンは長期的にサポートされる見込み

---

## 代替案（Alternatives）

### 代替案1: API version 2022-06-28 を継続使用

**概要**:
- 現在のAPIバージョンをそのまま使用し続ける

**利点**:
- 変更作業が不要
- 既存の動作が保証されている
- リスクがゼロ

**欠点**:
- 将来的にサポート終了のリスク
- 新機能（マルチソースデータベース等）が使えない
- 技術的負債の蓄積
- Notion公式の推奨バージョンから乖離

**不採用の理由**:
- 将来のサポート終了リスクが高い
- 新機能への対応が遅れる
- ClaudeCode全体での標準化ができない

### 代替案2: マルチソースデータベースの完全実装

**概要**:
- 2025-09-03の全機能（data_source_id管理等）を完全実装

**利点**:
- 最新機能を最大限活用できる
- 将来の拡張性が最大化される

**欠点**:
- 実装コストが非常に高い
- 現時点では不要な機能（マルチソース対応）
- テストコストが増大
- リリースまでの時間が長くなる

**不採用の理由**:
- 現在のユースケースではシングルソースで十分
- オーバーエンジニアリングのリスク
- YAGNI（You Aren't Gonna Need It）原則に反する
- 段階的アップグレードで十分対応可能

---

## 影響（Consequences）

### ポジティブな影響

- **最新API使用**: Notion公式の推奨バージョンを使用
- **将来対応**: マルチソースデータベースへの移行が容易に
- **標準化**: ClaudeCode全体で統一されたAPI使用
- **長期サポート**: 最新バージョンのサポート継続が期待できる
- **セキュリティ**: 最新のセキュリティアップデートを享受

### ネガティブな影響

- **テスト必要**: APIバージョン変更の動作確認が必要
- **潜在的な互換性問題**: 予期しない動作変更の可能性（低リスク）
- **ドキュメント更新**: 関連ドキュメントの更新が必要

### トレードオフ

- **実装コスト vs 将来リスク**: 短期的な実装コストを払って長期的なリスクを回避
- **完全実装 vs 段階的実装**: 段階的実装により、リスクとコストを最小化

### 影響を受けるコンポーネント/レイヤー

- **Data Layer**:
  - `src/data/datasources/NotionAPI.ts` - APIバージョン、型定義、検索フィルター
  - `src/data/repositories/NotionRepository.ts` - レスポンス処理ロジック

- **Documentation**:
  - `/Users/bon/dev/CLAUDE.md` - Notion API使用ルール追加

- **Tests**:
  - Notion API関連のテストケースの更新が必要（該当する場合）

---

## 実装（Implementation）

### 実装の詳細

**Phase 1: コア変更（実装済み）**

1. NotionAPI.tsの更新
   ```typescript
   // Before
   this.version = version || '2022-06-28';

   // After
   this.version = version || '2025-09-03';
   ```

2. 検索フィルターの更新
   ```typescript
   // Before
   filter: { value: 'database', property: 'object' }

   // After
   filter: { value: 'data_source', property: 'object' }
   ```

3. 型定義の追加
   ```typescript
   export interface NotionDataSourceResponse {
     object: 'data_source';
     id: string;
     name: string;
     type: 'notion_database';
     notion_database?: { id: string };
   }
   ```

4. NotionRepository.listDatabases()の更新
   ```typescript
   // database と data_source の両方を処理
   return response.results.map(result => {
     if (result.object === 'data_source') {
       return {
         id: result.notion_database?.id || result.id,
         title: result.name || 'Untitled',
       };
     } else {
       // 従来のdatabaseの場合
       const title = result.title.length > 0
         ? result.title[0].text.content
         : 'Untitled';
       return { id: result.id, title };
     }
   });
   ```

**Phase 2: ドキュメント更新（実装済み）**

- CLAUDE.mdにNotion API使用ルールを追加
- ADR-005の作成

### 実装の制約

- **後方互換性**: 既存のdatabase_idベースのAPIは引き続き動作
- **シングルソース前提**: 現時点ではマルチソースデータベースは非対応
- **段階的移行**: 必要に応じて将来的にdata_source_id管理を追加可能

### マイグレーション計画

**Phase 1（本リリース）**:
- ✅ APIバージョンの更新
- ✅ 検索API の data_source フィルター対応
- ✅ レスポンス型の拡張
- ✅ 両形式のレスポンス処理

**Phase 2（将来の拡張）**:
- data_source_id の明示的管理機能（必要に応じて）
- マルチソースデータベースのUI対応（必要に応じて）
- data_source 固有の機能活用（必要に応じて）

**ロールバック計画**:
- 問題が発生した場合、NotionAPI.ts のバージョンを `2022-06-28` に戻すことで即座にロールバック可能
- コンストラクタでバージョンを注入可能な設計により、テスト時の切り替えも容易

---

## 関連情報（Related）

### 関連ADR

- ADR-002: Clean Architecture採用（データソース層の設計）

### 関連ドキュメント

- [Notion API Upgrade Guide 2025-09-03](https://developers.notion.com/docs/upgrade-guide-2025-09-03)
- [Notion API Documentation](https://developers.notion.com/reference/)
- `/Users/bon/dev/CLAUDE.md` - ClaudeCode標準ルール

### 参考資料

- [Notion API Versioning](https://developers.notion.com/reference/versioning)
- [Multi-source Database Documentation](https://developers.notion.com/docs/working-with-databases#multi-source-databases)

---

## 備考（Notes）

### 今後の検討事項

- **マルチソースデータベース対応**: ユーザーからの要望があれば、data_source_id管理機能を追加
- **パフォーマンス監視**: 新APIバージョンでのレスポンスタイム・成功率を監視
- **Notionアップデート追従**: 今後のNotionアップデートを定期的にチェック

### テスト戦略

- **手動テスト**:
  - Notionトークン認証
  - データベース一覧取得
  - データベース詳細取得
  - ページ作成（バーコードスキャン結果の保存）

- **統合テスト**: 既存のテストスイートが全てパス することを確認

### リリース後の監視項目

- Notion API呼び出しの成功率
- エラーログの監視（新しいエラータイプの確認）
- ユーザーフィードバック（データベース検索・保存の動作）

---

**作成者**: Claude Code (Anthropic)
**レビュー者**: bon (Product Owner)
