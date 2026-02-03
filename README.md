# dl-list-markdown

> 📘 **日本語版はこちら** → [README-ja.md](./README-ja.md)

A monorepo for **colon-based definition list** support across Markdown tooling.

This project provides:

- A **markdown-it plugin** for parsing and rendering definition lists
- A **VS Code extension** that enables definition lists in Markdown Preview

The syntax is inspired by Pandoc-style definition lists and focuses on
clarity, minimalism, and compatibility.

## Definition list syntax

```markdown
: Term
    : Definition
````

Renders as:

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

## Packages

### `markdown-it-dl-list`

A **markdown-it plugin** that adds support for colon-based definition lists
using `<dl>`, `<dt>`, and `<dd>`.

* Designed for use in markdown-it pipelines
* Supports multiple definitions, dt-only entries, multiline terms, and nesting
* Intended for libraries, static site generators, and preview engines

📦 npm: [`markdown-it-dl-list`](https://www.npmjs.com/package/markdown-it-dl-list)
📄 Docs: [`packages/markdown-it-dl-list/README.md`](./packages/markdown-it-dl-list/README.md)

### `vscode-dl-list-preview`

A **VS Code extension** that enables colon-based definition lists in the
built-in Markdown Preview.

* Injects the markdown-it plugin into VS Code’s preview pipeline
* Preview-only (does not modify editor behavior)
* Lightweight and configuration-driven

🧩 VS Code Extension: [**DL List Preview (colon-based)**](https://marketplace.visualstudio.com/items?itemName=kanemu-dev.vscode-dl-list-preview)
📄 Docs: [`packages/vscode-dl-list-preview/README.md`](./packages/vscode-dl-list-preview/README.md)

## Repository structure

```text
dl-list-markdown/
├─ packages/
│  ├─ markdown-it-dl-list/
│  └─ vscode-dl-list-preview/
├─ README.md
├─ README-ja.md
└─ pnpm-workspace.yaml
```

## Development

This repository uses **pnpm workspaces**.

### Install dependencies

```bash
pnpm install
```

### Build all packages

```bash
pnpm build
```

### Build individual packages

```bash
pnpm --filter markdown-it-dl-list build
pnpm --filter vscode-dl-list-preview build
```

## Design goals

* Simple, readable syntax
* Clear separation between parsing and rendering
* Minimal interference with existing Markdown behavior
* Tooling-agnostic core logic

This project intentionally avoids supporting every existing definition list
dialect, favoring a small and predictable feature set.

---

© 2026 Yohei Kanamura Released under the MIT License.
