# DL List Preview (colon-based)

Adds **colon-based definition list** support to **VS Code’s built-in Markdown Preview**.

This extension enables `<dl>`, `<dt>`, and `<dd>` rendering using a simple,
Pandoc-inspired colon syntax.

## Features

- Colon-based definition list syntax
- Renders `<dl>`, `<dt>`, and `<dd>` in Markdown Preview
- Supports:
  - Multiple definitions per term
  - Term-only entries (dt-only)
  - Multiline terms
  - Nested definition lists
- Integrates with VS Code’s **built-in Markdown Preview**
- No commands, no editor modifications — preview only

## Syntax

### Basic definition list

```markdown
: Term
    : Definition
```

Preview output:

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

### Multiple definitions

```markdown
: Term
    : First definition
    : Second definition
```

### Term-only (dt-only)

A term without definitions is allowed **only when followed by a blank line or EOF**.

```markdown
: Term only

Next paragraph.
```

### Multiline terms

Indented lines following a term are treated as part of the same term.

```markdown
: This is a
  multiline term
    : Definition
```

### Nested definition lists

```markdown
: Outer term
    : : Inner term
          : Inner definition
    : Next definition
```

## Configuration

This extension provides the following setting:

### `dlListPreview.ddIndent`

Indentation (number of spaces) required for definition (`dd`) lines.

* Type: `number`
* Default: `4`
* Minimum: `1`
* Maximum: `12`

Example:

```json
{
  "dlListPreview.ddIndent": 2
}
```

## How it works

This extension injects a custom **markdown-it plugin** into VS Code’s
Markdown Preview pipeline.

It does **not**:

* Modify Markdown source files
* Add editor commands
* Affect non-Markdown files

## Requirements

* VS Code **1.85.0** or later
* Markdown Preview (built-in)

No additional dependencies are required.

## Known limitations

* This extension affects **preview rendering only**
* Exported HTML (e.g. via other tools) depends on their Markdown engine
* Syntax support is intentionally conservative and focused

## License

MIT
