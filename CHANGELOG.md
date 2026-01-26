# Changelog

All notable changes to this project will be documented in this file.

This repository is a **monorepo**, so each release may affect one or more
packages.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

---

## 0.1.5 - 2026-01-26

### markdown-it-dl-list

- Add a named export `markdownItDlList` alongside the default export.

## 0.1.4 - 2026-01-19

### markdown-it-dl-list

- Fixed incorrect indentation of block-level content inside `dd` elements

## 0.1.3 - 2026-01-19

### markdown-it-dl-list

- Added support for indentation using tabs
  - Tabs are treated as 4 spaces by default (configurable via the `ddIndent` option)
- Fixed an issue where consecutive `dt` lines before a `dd` were not converted correctly

## 0.1.2 - 2026-01-16

### markdown-it-dl-list

- Fixed incorrect parsing of nested definition lists (dt/dd misclassification and indentation handling)

### vscode-dl-list-preview

- Added CSS styles for definition lists in the Markdown preview

## 0.1.1 - 2026-01-15

### markdown-it-dl-list

- Removed custom renderer rules and delegated rendering to the default `renderToken`,
  enabling users to add custom attributes to rendered elements.
- Fixed an issue where line number information (`token.map`) was not correctly
  propagated when processing `<dd>` elements.

### vscode-dl-list-preview

- Hid the vertical guide line shown in the Markdown preview when placing the cursor
  on `<dl>` elements.

## 0.1.0 - 2026-01-14

### Added

- Initial release of **markdown-it-dl-list**
  - Colon-based definition list syntax (`: term`, `: definition`)
  - Support for multiple definitions per term
  - Support for dt-only entries (term without definitions)
  - Multiline term support
  - Nested definition lists
- Initial release of **vscode-dl-list-preview**
  - Enables definition lists in VS Code Markdown Preview
  - Configuration option: `dlListPreview.ddIndent`
  - Preview-only integration (no editor behavior changes)

---

## Versioning notes

- Package versions may differ between packages in this repository.
- The changelog documents **user-visible changes**, not internal refactors.
- Patch releases are used for bug fixes only.
- Minor releases may add syntax or options.
- Major releases may introduce breaking changes.

---

## Packages

- `markdown-it-dl-list`
- `vscode-dl-list-preview`
