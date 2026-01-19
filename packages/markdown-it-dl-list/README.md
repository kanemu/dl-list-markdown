# markdown-it-dl-list

A **markdown-it plugin** that adds support for **colon-based definition lists**
using `<dl>`, `<dt>`, and `<dd>`.

This plugin enables a simple and readable definition list syntax inspired by
Pandoc and other Markdown variants.

## Features

- Colon-based definition list syntax
- Supports `<dl>`, `<dt>`, and `<dd>`
- Multiple definitions per term
- Term-only entries (dt-only)
- Nested definition lists
- Designed to work with standard markdown-it pipelines

👉 **VS Code users:**
Use the companion extension
**[DL List Preview (colon-based)](https://marketplace.visualstudio.com/items?itemName=kanemu-dev.vscode-dl-list-preview)**  
to get proper `<dl>` rendering in the built-in Markdown preview.

## Installation

```bash
npm install markdown-it-dl-list
```

## Usage

```js
import markdownit from "markdown-it";
import dlList from "markdown-it-dl-list";

const md = markdownit();
md.use(dlList);

const src = `
: Term
    : Definition line 1
    : Definition line 2
`;

console.log(md.render(src));
```

Output:

```html
<dl>
  <dt>Term</dt>
  <dd>Definition line 1</dd>
  <dd>Definition line 2</dd>
</dl>
```

## Syntax

### Basic form

```markdown
: Term
    : Definition
```

### Multiple definitions

```markdown
: Term
    : First definition
    : Second definition
```

### Term-only (dt-only)

A term without definitions is allowed **only when followed by a blank line or EOF**:

```markdown
: Term only

Next paragraph.
```

### Multiline terms

Indented lines following a term are treated as part of the term:

```markdown
: This is a
  multiline term
    : This is a
      multiline definition
```

### Nested definition lists

```markdown
: Outer term
    : : Inner term
          : Inner definition
    : Next definition
```

## Options

```ts
type DlListOptions = {
  /** Indent (spaces) required for dd lines. Default: 4 */
  ddIndent?: number;

  /** Require at least one dd unless dt-only is followed by blank line or EOF. Default: true */
  requireDd?: boolean;

  /** Stop parsing the current dl at the first blank line after items. Default: true */
  breakOnBlankLine?: boolean;
};
```

Example:

```js
md.use(dlList, {
  ddIndent: 2,
  requireDd: true,
});
```

## What this plugin does NOT do

* Does not modify Markdown rendering outside definition lists
* Does not change markdown-it default paragraph behavior
* Does not attempt to support every existing definition list syntax variant

## Related projects

- [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
  A remark plugin that adds the same colon-based definition list syntax to unified / remark pipelines.

## License

MIT
