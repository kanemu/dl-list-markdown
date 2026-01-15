#!/usr/bin/env bash
set -euo pipefail

# =========================
# vscode-dl-list-preview publish script
# =========================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$ROOT_DIR/packages/vscode-dl-list-preview"

cd "$ROOT_DIR"

# ---- helpers ----
die () { echo "ERROR: $*" >&2; exit 1; }
need_cmd () { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

# ---- preflight ----
need_cmd pnpm
need_cmd git
need_cmd vsce

echo "==> Verify repository root"
test -f pnpm-workspace.yaml || die "pnpm-workspace.yaml not found (run from repo root)"

echo "==> Verify package directory"
test -d "$PKG_DIR" || die "Package dir not found: $PKG_DIR"

echo "==> Ensure clean git working tree"
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "Working tree is not clean. Commit or stash changes before publishing."
fi

echo "==> Ensure VS Code publisher is logged in"
vsce ls-publishers >/dev/null 2>&1 || die "Not logged in to vsce. Run: pnpm exec vsce login"

# ---- build ----
echo ""
echo "==> Build vscode extension"
pnpm --filter vscode-dl-list-preview build

# ---- sanity checks ----
echo "==> Sanity check build artifacts"
test -f "$PKG_DIR/dist/extension.js" || die "dist/extension.js not found (build failed?)"

echo "==> Ensure markdown-it-dl-list is bundled"
if grep -q 'require("markdown-it-dl-list")' "$PKG_DIR/dist/extension.js"; then
  die "markdown-it-dl-list is NOT bundled. Check tsup noExternal setting."
fi

# ---- package ----
echo ""
echo "==> Package VSIX"
pnpm --filter vscode-dl-list-preview package

VSIX_FILE="$(ls "$PKG_DIR"/*.vsix | tail -n 1)"
test -f "$VSIX_FILE" || die "VSIX file not found"

echo "==> VSIX created:"
echo "    $VSIX_FILE"

# ---- publish ----
echo ""
echo "==> Publish to VS Code Marketplace"
pnpm exec vsce publish --packagePath "$VSIX_FILE"

echo ""
echo "==> ✅ VS Code extension published successfully"
