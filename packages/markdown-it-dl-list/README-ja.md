# markdown-it-dl-list

> 📕 **English version** → [README.md](./README.md)

`<dl>`, `<dt>`, `<dd>` を使った
**コロン記法の定義リスト**をサポートする **markdown-it プラグイン**です。

Pandoc などに見られる定義リスト構文に着想を得た、
シンプルで読みやすい記法を markdown-it で利用できます。

## 特徴

- コロン（`:`）による定義リスト構文
- `<dl>`, `<dt>`, `<dd>` を生成
- 1つの用語に複数の定義を記述可能
- 定義を持たない用語（dt-only）に対応
- 入れ子の定義リストをサポート
- 標準的な markdown-it の処理フローに統合可能

👉 **VS Code を利用している方へ:**
VS Code の組み込み Markdown プレビューで `<dl>` 要素を正しく表示するには、
以下の拡張機能を併せてインストールしてください。

**[DL List Preview (colon-based)](https://marketplace.visualstudio.com/items?itemName=kanemu-dev.vscode-dl-list-preview)**

## インストール

```bash
npm install markdown-it-dl-list
```

## 使い方

```js
import markdownit from "markdown-it";
import dlList from "markdown-it-dl-list";

const md = markdownit();
md.use(dlList);

const src = `
: 用語
    : 説明文その1
    : 説明文その2
`;

console.log(md.render(src));
```

出力結果：

```html
<dl>
  <dt>用語</dt>
  <dd>説明文その1</dd>
  <dd>説明文その2</dd>
</dl>
```

## 構文

### 基本形

```markdown
: 用語
    : 説明文
```

### 複数の定義

```markdown
: 用語
    : 説明文その1
    : 説明文その2
```

### 定義を持たない用語（dt-only）

定義を持たない用語は、
**直後が空行またはファイル末尾の場合のみ**有効です。

```markdown
: 用語のみ

次の行
```

### 複数行の用語（dt 継続行）

用語行の直後にインデントされた行が続く場合、
それらは同じ用語として扱われます。

```markdown
: これは複数行の
  用語です。
    : これは複数行の
      説明文です。
```

### 入れ子の定義リスト

```markdown
: 外側の用語
    : : 内側の用語
          : 内側の説明文
    : 次の説明文
```

定義リストの詳細な書式については、
→ **[定義リスト構文仕様（unified / remark）](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

※ このドキュメントは構文仕様のみを扱っています。
エディタプレビューなど、markdown-it 固有の挙動については
本パッケージの README を参照してください。

## オプション

```ts
type DlListOptions = {
  /** dd 行に必要なインデント（スペース数）。デフォルト: 4 */
  ddIndent?: number;

  /** 定義（dd）を必須とするかどうか。デフォルト: true */
  requireDd?: boolean;

  /** 空行で現在の定義リストを終了するか。デフォルト: true */
  breakOnBlankLine?: boolean;
};
```

使用例：

```js
md.use(dlList, {
  ddIndent: 2,
  requireDd: true,
});
```

## このプラグインが「しないこと」

* 定義リスト以外の Markdown の挙動は変更しません
* markdown-it の標準的な段落処理は維持されます
* すべての既存定義リスト構文を網羅することは目的としていません

A remark plugin that adds the same colon-based definition list syntax to unified / remark pipelines.

## 関連プロジェクト

- [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
  unified / remark パイプライン向けに、同じコロン記法の説明リスト構文を追加する remark プラグインです。

## ライセンス

MIT
