#!/usr/bin/env bash
set -euo pipefail

# Publish only: packages/markdown-it-dl-list
# Run from repo root.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PKG_DIR="packages/markdown-it-dl-list"
PACK_PREVIEW_DIR="$ROOT_DIR/.pack-preview"

# ---- helpers ----
die () { echo "ERROR: $*" >&2; exit 1; }
need_cmd () { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

# ---- preflight ----
need_cmd pnpm
need_cmd npm
need_cmd git

echo "==> Verify repo root"
test -f pnpm-workspace.yaml || die "pnpm-workspace.yaml not found in current directory"
test -d "$PKG_DIR" || die "Package directory not found: $PKG_DIR"
test -f "$PKG_DIR/package.json" || die "package.json not found: $PKG_DIR/package.json"

echo "==> Ensure clean git working tree (recommended)"
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "Working tree is not clean. Commit or stash changes before publishing."
fi

echo "==> Ensure npm login"
npm whoami >/dev/null 2>&1 || die "Not logged in to npm. Run: npm login"

echo "==> Check dependency specifiers (disallow workspace:* and non-workspace:^)"
if grep -R --line-number '"workspace:\*"' "$PKG_DIR/package.json"; then
  die 'Found "workspace:*". Use "workspace:^x.y.z" (or a real semver) instead.'
fi
if grep -R --line-number '"workspace:' "$PKG_DIR/package.json" | grep -v '"workspace:\^'; then
  die 'Found workspace protocol not using "workspace:^...". Please normalize.'
fi

echo "==> Install (if needed)"
pnpm -v >/dev/null

echo "==> Build + test only this package (and its deps if needed)"
# build first so dist exists for pack/publish
pnpm --filter ./packages/markdown-it-dl-list... build
# run tests only for this package if it has them
pnpm --filter ./packages/markdown-it-dl-list test

# ---- pack preview ----
echo "==> Pack preview (local tarball)"
rm -rf "$PACK_PREVIEW_DIR"
mkdir -p "$PACK_PREVIEW_DIR"
(
  cd "$PKG_DIR"
  pnpm pack --silent --pack-destination "$PACK_PREVIEW_DIR" >/dev/null
)
echo "==> Pack preview created in: $PACK_PREVIEW_DIR"

# ---- publish ----
echo ""
echo "==> Publishing: $PKG_DIR"
(
  cd "$PKG_DIR"
  # --no-git-checks: we already checked cleanliness above
  pnpm publish --no-git-checks
)
echo "==> Published: $PKG_DIR"

echo ""
echo "==> Done."
echo "Tip: tag the release (e.g. git tag v0.1.0 && git push --tags) if you want."
