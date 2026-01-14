# dl-list-markdown

Markdown に **コロン記法の定義リスト（definition list）**を追加するための
ツール群をまとめた **モノレポ**です。

Pandoc などに見られる定義リスト構文に着想を得て、
**読みやすさ・最小限の仕様・既存 Markdown との共存**を重視しています。

## 定義リスト構文

```markdown
: 用語
    : 定義
```

上記は、以下の HTML としてレンダリングされます。

```html
<dl>
  <dt>用語</dt>
  <dd>定義</dd>
</dl>
```

## パッケージ構成

### `markdown-it-dl-list`

**markdown-it 用プラグイン**です。
コロン記法の定義リストを解析し、`<dl>`, `<dt>`, `<dd>` を生成します。

* markdown-it のパイプラインに組み込み可能
* 複数定義、dt-only、複数行用語、入れ子構造をサポート
* SSG やプレビューエンジンでの利用を想定

📦 npm: `markdown-it-dl-list`
📄 ドキュメント:
[`packages/markdown-it-dl-list/README.md`](./packages/markdown-it-dl-list/README.md)
[`packages/markdown-it-dl-list/README-ja.md`](./packages/markdown-it-dl-list/README-ja.md)

### `vscode-dl-list-preview`

**VS Code 拡張機能**です。
組み込みの Markdown Preview に、定義リスト構文を追加します。

* markdown-it プラグインを Preview パイプラインに注入
* プレビュー専用（エディタ動作や Markdown ソースは変更しない）
* 設定によるインデント調整に対応

🧩 VS Code Extension:
**DL List Preview (colon-based)**
📄 ドキュメント:
[`packages/vscode-dl-list-preview/README.md`](./packages/vscode-dl-list-preview/README.md)

## リポジトリ構成

```text
dl-list-markdown/
├─ packages/
│  ├─ markdown-it-dl-list/
│  └─ vscode-dl-list-preview/
├─ README.md
├─ README-ja.md
└─ pnpm-workspace.yaml
```

## 開発方法

このリポジトリは **pnpm workspaces** を使用しています。

### 依存関係のインストール

```bash
pnpm install
```

### 全パッケージのビルド

```bash
pnpm build
```

### 個別パッケージのビルド

```bash
pnpm --filter markdown-it-dl-list build
pnpm --filter vscode-dl-list-preview build
```

## 設計方針

* シンプルで読みやすい構文
* 解析（plugin）と表示（preview）の明確な分離
* 既存の Markdown 構文への影響を最小限に
* 仕様を必要以上に広げない

本プロジェクトは、
**すべての定義リスト方言を網羅すること**を目的としていません。
予測可能で保守しやすい仕様を優先しています。

---

© 2026 Yohei Kanamura Released under the MIT License.
