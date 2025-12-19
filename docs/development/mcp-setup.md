# MCP（Model Context Protocol）設定ガイド

## 🔧 MCPとは

MCPは、ClaudeがNotion、GitHub、Playwright等の外部サービスと連携するためのプロトコルです。

## ⚠️ 重要: APIキー管理の原則

**絶対にAPIキーをコードやGitにコミットしないこと**

### APIキーの安全な管理方法

1. **環境変数または `.env` ファイルで管理**
2. **`.gitignore` に必ず追加**（本プロジェクトでは既に設定済み）
3. **平文での保存を避ける**

## 📁 推奨される設定構造

### プロジェクトレベルの設定（推奨）

```text
NotionBarcodeReader/
├── .env                          # APIキー・機密情報（.gitignoreに追加済み）
├── .env.example                  # 環境変数のテンプレート（Gitにコミット可）
└── .claude/
    ├── settings.json             # Claude Code 基本設定
    └── settings.local.json       # ローカル固有設定
```

### `.env` ファイルの例

```bash
# Notion API
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_database_id_here

# GitHub (必要に応じて)
GITHUB_TOKEN=your_github_token_here
```

### `.env.example` ファイルの例（Gitにコミット可）

```bash
# Notion API
NOTION_API_KEY=
NOTION_DATABASE_ID=

# GitHub (必要に応じて)
GITHUB_TOKEN=
```

## 🔒 現在の設定の問題点と修正方法

### 問題点

現在、`~/.config/claude/settings.json` にNotionのAPIキーが平文で保存されています：

```json
{
  "notion": {
    "api_key": "ntn_YOUR_API_KEY_HERE",
    "database_ids": {
      "backlog_items": "YOUR_DATABASE_ID_HERE"
    }
  }
}
```

**この方法は以下の理由で非推奨です**：
- グローバル設定にプロジェクト固有の情報が含まれる
- APIキーが平文で保存されている
- バックアップや同期時に機密情報が漏洩するリスク

### 修正手順

#### 1. プロジェクトルートに `.env` ファイルを作成

```bash
cd /path/to/your/project
touch .env
```

#### 2. `.env` ファイルにAPIキーを移動

```bash
# .env
NOTION_API_KEY=ntn_YOUR_API_KEY_HERE
NOTION_DATABASE_ID_BACKLOG=YOUR_DATABASE_ID_HERE
```

#### 3. `.env.example` ファイルを作成（Gitにコミット可）

```bash
# .env.example
NOTION_API_KEY=
NOTION_DATABASE_ID_BACKLOG=
```

#### 4. `~/.config/claude/settings.json` から機密情報を削除

```bash
# バックアップを取る
cp ~/.config/claude/settings.json ~/.config/claude/settings.json.backup

# 内容を空にするか、プロジェクト固有でない設定のみ残す
echo '{}' > ~/.config/claude/settings.json
```

## 📝 MCPサーバーの設定（必要に応じて）

Claude CodeでMCPサーバーを使用する場合は、以下のような設定ファイルを使用します：

### `.claude/mcp.json` （例）

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "${NOTION_API_KEY}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**注意**: 環境変数 `${NOTION_API_KEY}` は `.env` ファイルから読み込まれます。

## ✅ セキュリティチェックリスト

- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] `.env.example` を作成し、Gitにコミット
- [ ] APIキーをコードに直接記述していない
- [ ] `~/.config/claude/settings.json` から機密情報を削除
- [ ] チーム内で `.env` ファイルの安全な共有方法を確立

## 🔄 環境変数の読み込み（コード例）

TypeScriptコードで環境変数を使用する場合：

```typescript
// 環境変数の読み込み
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID_BACKLOG;

if (!NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY is not set in .env file');
}
```

## 📚 参考リンク

- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [Notion API公式ドキュメント](https://developers.notion.com/)
- [環境変数のベストプラクティス](https://12factor.net/config)
