# PRP（Product Requirements Prompts）管理ルール

## TODOの分解・管理

1. **要求の分解**: 要求を紐解いてTODOとして定義し、なるべくシンプルなTODOの集合体となるよう分解すること
2. **並行処理の検討**: シンプルなTODOの集合体を並行して進められるTODOに分解できる場合、並行として進められるタスクごとにまとめること
3. **PRP作成**: 任意の名称のProduct Requirements Prompts(PRP)としてマークダウンファイルとして出力すること

## PRP管理ディレクトリ構造

```text
docs/product/
├── [PRP名].md
├── P1_[高優先度PRP名].md
├── P2_[中優先度PRP名].md
├── P3_[低優先度PRP名].md
├── done/
│   ├── [完了PRP名].md
│   └── [完了PRP名].md
└── templates/
    └── prp_base.md (テンプレート)
```

- **作成場所**: `docs/product/`
- **優先度分類**: P1（高）、P2（中）、P3（低）でファイル名を開始
- **サブディレクトリ**: `done`（完了）、`templates`（テンプレート）

## PRP完了時の管理フロー

1. **完了確認**: PRP内の全タスクが完了したことを確認
2. **done移動**: 完了したPRPファイルを `done/` ディレクトリに移動

   ```bash
   # 例: P2タスクの完了時
   mv "docs/product/P2_20250718_documentation_structure.md" "docs/product/done/"
   ```

3. **ステータス更新**: TodoWriteツールで該当タスクを `completed` に変更
4. **次タスク移行**: 次の優先度タスクに移行（P1→P2→P3の順序）

**重要**: PRPの `done` 移動は完了の公式な記録であり、プロジェクト進捗管理の基準となる
