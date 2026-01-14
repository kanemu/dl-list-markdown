# Changelog

All notable changes to this project will be documented in this file.

This repository is a **monorepo**, so each release may affect one or more
packages.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

---

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
